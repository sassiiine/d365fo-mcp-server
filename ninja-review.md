# Review: dynamics365ninja/d365fo-mcp-server

Scope: read directly from source (`src/`, `bridge/`, `scripts/`, `eval/`) with file:line citations. README/docs (`docs/*.md`) were used only to cross-check, never as the primary source. Any claim not traceable to code is flagged as such explicitly.

---

## 1. Architecture

### 1.1 Component split

**Node/TypeScript MCP server** (`src/`) — the primary artifact:
- Implements the MCP protocol endpoint (stdio or HTTP) — [src/server/mcpServer.ts](src/server/mcpServer.ts), [src/server/transport.ts](src/server/transport.ts), [src/index.ts](src/index.ts).
- Owns the pre-built SQLite symbol index (`xpp-metadata.db`, `xpp-metadata-labels.db`) used by nearly every read/search tool.
- Runs all X++ static validation, pattern analysis, code generation, and label management **offline**, without D365FO installed.
- Directly shells out to `xppc.exe`, `SyncEngine.exe`, `SysTestConsole.exe`/`SysTestRunner.exe`, and `xppbp.exe` for build/sync/test/BP-check — these are **not** delegated to the C# bridge (see §4).
- Spawns the C# bridge as a child process when live metadata access is needed.

**C# Metadata Bridge** (`bridge/D365MetadataBridge/`) — a `net48` console executable ([D365MetadataBridge.csproj:5](bridge/D365MetadataBridge/D365MetadataBridge.csproj)):
- Wraps Microsoft's official D365FO metadata SDK (`IMetadataProvider`, `IMetaClassProvider`, `IMetaTableProvider`, `IMetaFormProvider`, `ICrossReferenceProvider`).
- Handles **live reads** of tables/classes/forms/enums/EDTs directly from disk (no DB), and **all write operations** (create/modify) via typed object-model mutation (`Services/MetadataWriteService.cs`).
- Handles cross-reference queries via a SQL Server "xref" database, default host `localhost` (`Program.cs`, `--xref-server` flag; also documented as default in [src/bridge/bridgeClient.ts:36](src/bridge/bridgeClient.ts)).
- References D365FO assemblies via an unversioned glob `$(D365BinPath)\Microsoft.Dynamics.*.dll` ([D365MetadataBridge.csproj:59](bridge/D365MetadataBridge/D365MetadataBridge.csproj)) — picks up whatever DLLs exist in the configured bin path.

### 1.2 Node ↔ Bridge protocol

Newline-delimited JSON-RPC-style messages over the bridge's stdin/stdout (spawned as a child process, not a network service): `{"id": "...", "method": "...", "params": {...}}` in, `{"id": "...", "result": {...}}` out. Bridge stderr is piped to Node's stderr for diagnostics. A special ready message (`{"id":"ready","result":{"status":"ready", "metadataAvailable": true, ...}}`) signals bridge startup. Read methods are retried automatically on transient failure; write methods are not (`src/bridge/bridgeClient.ts`, `RETRYABLE_METHODS`, ~line 96–104). Default per-call timeout is 60s, configurable via `BRIDGE_CALL_TIMEOUT_MS`. Protocol framing itself is defined in `bridge/D365MetadataBridge/Protocol/BridgeProtocol.cs` and `RequestDispatcher.cs`.

### 1.3 Where things run

Three `SERVER_MODE` values exist ([src/server/serverMode.ts](src/server/serverMode.ts), consumed in [src/server/mcpServer.ts:227–235](src/server/mcpServer.ts)):

| Mode | Typical location | Tool count | DB | Bridge |
|---|---|---|---|---|
| `full` | Developer's local Windows machine (VS Code / VS 2022) | 26 (all) | Local SQLite | Optional, spawned if D365FO detected |
| `write-only` | D365FO build/dev VM (companion process) | 13 (`LOCAL_TOOLS` + `ALWAYS_TOOLS`) | none (skipped, [src/index.ts:156-160]) | Required |
| `read-only` | Azure App Service (cloud/multi-tenant) | 13 (everything except `LOCAL_TOOLS`) | SQLite downloaded from Blob Storage on startup ([src/index.ts:212-227]) | Not available |

Transport: stdio for local VS Code/VS 2022 clients; HTTP (`POST /mcp`, request/response, not SSE) for Azure ([src/server/transport.ts:195-420]). HTTP mode uses tiered timeouts — fast tools (search) 30s, heavy tools (build/sync/systest) 600s, default 120s, all overridable via `MCP_TOOL_TIMEOUT*` env vars ([src/server/transport.ts:22-51]).

Azure deployment topology (`infrastructure/main.bicep`, `.azure-pipelines/*.yml`) deploys the Node server as an App Service container; the C# bridge is Windows/D365FO-SDK-dependent and is **not** deployable there — Azure is inherently read-only for this reason, confirmed by the `read-only` mode's tool exclusions matching exactly the bridge/filesystem-dependent tool set.

Standalone operation: the TS server does **not** require the bridge to function. Search, symbol lookup, pattern analysis, validation, and code generation run entirely off the pre-built SQLite index. The bridge is only needed for live (not-yet-indexed) metadata reads, all write operations, and cross-reference queries.

### 1.4 Full MCP tool inventory (26 tools)

Source of truth: [src/server/toolSchemas/index.ts:33-60](src/server/toolSchemas/index.ts) — this is the exact published list and order. Each tool is a "dispatcher" with a `mode`/`action`/`domain` discriminator routing to many internal handlers in `src/tools/*.ts` (there are ~100 files in `src/tools/`, but only 26 are exposed as MCP tools).

| # | Tool | Purpose | Key inputs | Notes / availability |
|---|---|---|---|---|
| 1 | `search` | Full-text/exact symbol search over the SQLite index (584K+ symbols per docs) | `query`, `type`, `scope`, `limit`, `queries[]` (batch) | Always (DB-backed) |
| 2 | `batch_get_info` | Fetch metadata for 2–10 objects in parallel | `objects[]: {name,type}` | Always (DB-backed) |
| 3 | `generate_object` | Text/XML generation: pattern skeleton, whole-object scaffold (table/form/**report**), find-methods, relation-xpp, fields, table-relation | `mode`, `name`, `pattern`/`objectType` | Always, offline, no filesystem write |
| 4 | `analyze_code` | Mine codebase for patterns/implementations/completeness/API usage | `mode`, `scenario`/`methodName`/`apiName` | Always (DB-backed) |
| 5 | `d365fo_file` | Create/modify/generate D365FO object XML | `action`, `objectType`, `objectName`, `sourceCode`/`xmlContent` | `ALWAYS_TOOLS` — degrades gracefully off-Windows |
| 6 | `find_references` | Where-used across classes/methods/fields/tables | `targetName`, `targetType`, `ownerName` | Always (DB-backed xref) |
| 7 | `get_method` | Method signature/source lookup | `className`, `methodName`, `include` | `LOCAL_TOOLS` (bridge-backed in write-only) |
| 8 | `get_object_info` | Universal object reader (class/table/form/query/view/enum/edt/**report**/data-entity/menu-item/service/map/config-key/security-policy/macro) | `objectType`, `name`, `options` | `ALWAYS_TOOLS` |
| 9 | `labels` | Label CRUD: search/info/create/update/rename/list | `action`, `model`, `labelFileId`, `labelId` | `ALWAYS_TOOLS`, writes gated by FS |
| 10 | `object_patterns` | Table/form pattern toolkit incl. FP001–FP010 form-pattern rule checks | `domain`, `tableGroup`/`action`, `formPattern` | Always (DB-backed) |
| 11 | `suggest_edt` | Fuzzy-match EDT suggestions for a field name | `fieldName`, `context`, `limit` | Always (DB-backed) |
| 12 | `security_info` | Privilege/duty/role chain, or coverage lookup | `mode`, `name`/`objectName` | Always (DB-backed) |
| 13 | `extension_info` | CoC/events/table-merge/extension-points/strategy analysis | `mode`, `target`, `goal` | Always (DB-backed) |
| 14 | `validate_object_naming` | Validate proposed name vs prefix/suffix/conflict rules | `proposedName`, `objectType`, `baseObjectName` | Always (DB-backed) |
| 15 | `get_workspace_info` | Model name, package/framework paths, EXTENSION_PREFIX | `projectName`/`projectPath`, `diagnostics` | `LOCAL_TOOLS` |
| 16 | `verify_d365fo_project` | Confirm objects exist on disk and in `.rnrproj` | `objects[]`, `projectPath` | `LOCAL_TOOLS` |
| 17 | `update_symbol_index` | Index a newly created file, or lightweight cache refresh | `filePath` (optional) | `LOCAL_TOOLS` |
| 18 | `build_d365fo_project` | Build via `xppc.exe` | `modelName`, `fullBuild`, `buildReferencedModels`, `wait` | `LOCAL_TOOLS` (Windows only) |
| 19 | `trigger_db_sync` | Run `SyncEngine.exe` (full or partial table sync) | `modelName`, `tables[]`, `syncViews` | `LOCAL_TOOLS` (Windows only) |
| 20 | `run_bp_check` | Run `xppbp.exe` Best Practice checker | `projectPath`, `targetFilter`, `modelName` | `LOCAL_TOOLS` (Windows only) |
| 21 | `run_systest_class` | Run a SysTest class via `SysTestConsole.exe`/`SysTestRunner.exe` | `className`, `testMethod` | `LOCAL_TOOLS` (Windows only, needs interactive console — see §4) |
| 22 | `review_workspace_changes` | Review uncommitted `git diff HEAD` changes for BP/label/pattern issues | `directoryPath` | `LOCAL_TOOLS` (git) |
| 23 | `undo_last_modification` | Roll back a file via `git checkout` or delete-if-untracked | `filePath` | `LOCAL_TOOLS` (git/filesystem) |
| 24 | `get_knowledge` | X++ knowledge base lookup, or error-message diagnosis | `kind`, `topic`/`errorText` | Always, offline |
| 25 | `validate_code` | Static syntax/BP validation, or semantic reference validation vs. index | `mode`, `code`, `codeType` | Always (DB-backed) |
| 26 | `prepare` | Grounding/context aggregator for change vs. create; issues a `groundingToken` (30-min TTL) | `mode`, `goal`, `objectName` | Always (DB + bridge hybrid) |

`LOCAL_TOOLS`/`ALWAYS_TOOLS` sets: [src/server/serverMode.ts:39-55, 68-80]. In `read-only` mode 13 tools are excluded (all `LOCAL_TOOLS`); in `write-only` mode only `LOCAL_TOOLS`+`ALWAYS_TOOLS` (13) are published.

---

## 2. Table/metadata indexing pipeline

### 2.1 Pipeline: `extract-metadata.ts` → `build-database.ts` → `build-fts.ts`

**Root path resolution** ([scripts/extract-metadata.ts:19]): `D365FO_PACKAGE_PATH` env var, else hardcoded fallback `C:\AOSService\PackagesLocalDirectory`. `build-database.ts:14` and `build-fts.ts:15` default to `K:\AosService\PackagesLocalDirectory` instead — **the three scripts disagree on the default drive letter** (`C:` vs `K:`), which only matters if `D365FO_PACKAGE_PATH`/equivalent is unset. UDE auto-detection (via `XppConfigProvider`) takes priority when available and supplies `customPackagesPath`/`microsoftPackagesPath` separately ([extract-metadata.ts:181-197]).

**Element types scanned** ([extract-metadata.ts:153-163]): `AxClass, AxTable, AxForm, AxQuery, AxView, AxDataEntityView, AxEnum, AxEdt, AxReport, AxSecurityPrivilege, AxSecurityDuty, AxSecurityRole, AxMenuItemDisplay/Action/Output, AxTableExtension, AxClassExtension, AxFormExtension, AxEnumExtension, AxEdtExtension, AxDataEntityViewExtension, AxService, AxServiceGroup, AxMap, AxConfigurationKey, AxLicenseCode, AxSecurityPolicy, AxMacroDictionary`. Directory scanning is case-insensitive (both `AxClass` and `axclass` are tried, for Linux CI agents) and follows symlinks ([extract-metadata.ts:322]).

**AxTable parsing** ([src/metadata/xmlParser.ts:98-131, 228-256, 299-308]): name, label, TableGroup, primary/clustered index, fields (name/type stripped from `i:type`, EDT, mandatory, label), field indexes (fields, unique via `AlternateKey`, clustered), relations (name, related table, field↔relatedField constraint pairs — **no explicit cardinality on AxTable relations**, only on Views), and methods (`SourceCode/Methods/Method[]`).

**AxForm parsing** ([xmlParser.ts:514-570, 575-654]): name/model/sourcePath, label/caption, `FormPattern`/`FormPatternVersion` from `Design/Pattern`, data sources (table, AllowEdit/Create/Delete, bound fields, datasource methods), and a recursive `walkFormDesign()` (in `src/metadata/formPatternMiner.ts`) that walks the control tree, normalizes control types (`AxFormGridControl`→`Grid`, etc.), and records a `PatternNodeRecord` per patterned container/root.

**EDT parsing** ([xmlParser.ts:659-724]): `Extends` (primitive or another EDT — chain not transitively resolved, just stored one level), `EnumType`, `ReferenceTable`, `RelationType`, sizing (StringSize/DatabaseStringSize/DisplayLength), formatting, label/help text, ConfigurationKey.

**View/DataEntityView parsing** ([xmlParser.ts:136-171, 325-356]): fields (dataSource/dataField/dataMethod for computed fields), primary key fields, and relations that **do** carry `RelationType`/`Cardinality` (e.g. `ZeroOrOne`, `ZeroOrMore`) — unlike AxTable relations.

### 2.2 Resulting SQLite schema

Two databases are produced: the main metadata/symbol DB and a separate labels DB.

**Main `symbols` table** ([src/metadata/symbolIndex.ts:262-289]) — one row per indexed element (class, table, form, method, field, enum, edt, report, security artifact, menu item, extension, service, etc.):
`id, name, type, parent_name, signature, file_path, model, package_name, description, tags, source_snippet, source, complexity, used_types, method_calls, inline_comments, extends_class, implements_interfaces, usage_example, usage_frequency, pattern_type, typical_usages, called_by_count, related_methods, api_patterns`.

Indexes ([symbolIndex.ts:354-371]): `idx_symbols_name/type/model/pattern_type/parent_name`, composite `idx_type_parent`, `idx_type_name`, `idx_parent_type_name`, `idx_extends_class` (for CoC resolution), plus a unique constraint on `(name, type, COALESCE(parent_name,''), model)`.

`symbols_fts` FTS5 virtual table ([symbolIndex.ts:334-346]) indexes `name, type, parent_name, signature, description, tags, source_snippet, inline_comments` — but query-time column filtering excludes `source_snippet`/`inline_comments` for performance ([~line 898-901]).

Supporting tables ([symbolIndex.ts:373-738]): `code_patterns`, `table_relations`, `form_datasources`, `form_patterns`, `edt_metadata`, `security_privilege_entries`, `security_duty_privileges`, `security_role_duties`, `menu_item_targets`, `extension_metadata`, `service_operations`, `service_group_members`, `map_mappings`, `security_policies`, `macro_defines`, `property_stats`. Plus an on-demand `_build_progress(model, indexed_at)` table used for resumable CI builds.

**Labels DB** (separate file): `labels(id, label_id, label_file_id, model, language, text, comment, file_path)` + `labels_fts` FTS5 over `label_id, text, comment`. FTS is restricted to `en-us` only to keep the index compact.

### 2.3 Relations, EDT inheritance, CoC, menu-item mapping

- **Table relations/cardinality**: stored as field-constraint pairs in `table_relations`; cardinality is only present for View/DataEntityView relations (`RelationType`/`Cardinality` columns), not AxTable relations — this reflects the underlying metadata (AX doesn't put cardinality on table relations either).
- **EDT inheritance**: single-level `extends` column in `edt_metadata`; the caller must walk the chain manually (no precomputed transitive closure).
- **Chain-of-Command / extensions**: `AxClassExtension`/`AxTableExtension`/`AxFormExtension` files are parsed via `parser.parseExtensionFile()` and stored in `extension_metadata` with `base_object_name`, `extension_type`, `added_fields` (JSON), `coc_methods` (JSON). An index on `base_object_name` gives reverse lookup ("all extensions of class X").
- **Menu-item → form/query/report → datasource**: `menu_item_targets` maps menu item → target object/type/privilege/label; `form_datasources` maps form → datasource → table with edit/create/delete flags. There is **no precomputed join** between these two tables — a caller must join them manually to answer "which menu items open a form bound to table X."

### 2.4 Scale / performance

- `build-database`/`build-fts` are run with `--max-old-space-size=6144` (6 GB heap) locally ([package.json:20-21]); CI uses 4 GB (`.azure-pipelines/*.yml`). Per-model transactions cap peak memory around ~500 MB/model.
- Estimated durations (per the indexing agent's synthesis of pipeline structure/CI job splitting, not an explicit benchmark comment in code): extract ~40-60 min, build-database ~90 min, build-fts ~30-60 min for a full Foundation+ISV install (300K+ XML files) — CI splits this into two ~2-hour Azure Pipeline jobs to stay under the platform time limit.
- No hardcoded row/file-count ceiling; scaling is heap- and wall-clock-bound. `LABEL_LANGUAGES` (default `en-US,cs,sk,de`) trims the labels DB from ~20M to ~1M rows.
- **This means it does handle a full standard+ISV layer install**, but only with a multi-hour, multi-gigabyte-heap batch job — not something you'd re-run casually.

### 2.5 Incremental vs. full rebuild

Controlled by `EXTRACT_MODE` (`all` | `custom` | `standard`; [extract-metadata.ts:26-27,53-74], [build-database.ts:63-132]):
- `all` (default): wipes extracted-metadata dir and DB, full rebuild, `VACUUM=true`.
- `custom`: only clears/rebuilds symbols for models matching `CUSTOM_MODELS`, standard-model symbols preserved.
- `standard`: only clears/rebuilds standard (non-custom) models.

**There is no file-level hash/timestamp diffing** — even "incremental" mode fully rescans every XML file belonging to the selected model set; the only savings is skipping models outside that set. A `RESUME=true` mode checks `_build_progress` to skip already-completed models after a CI timeout, which is a checkpoint mechanism, not true delta-indexing.

---

## 3. XML write safety

### 3.1 Two write paths — bridge (primary) vs. direct string fallback

**Primary path — C# bridge, real object-model edits, not string manipulation.** `bridge/D365MetadataBridge/Services/MetadataWriteService.cs` constructs typed SDK objects (`new AxClass{...}`, `new AxTable{...}`), mutates them via typed setters/`AddField()`/`AddMethod()`/`AddIndex()`/`AddRelation()`, then calls the SDK's own `Create()`/`Update()` via `IMetaClassProvider`/`IMetaTableProvider`/`IMetaFormProvider` (e.g. lines 174-322 for table/class creation, 1138-1227 for method updates). The SDK owns serialization to XML — this is a proper, type-safe object-model edit, not regex/string patching.

**Fallback path — direct XML string manipulation on the Node side**, used only when the bridge is unavailable or can't reach an object (`src/tools/modifyD365File.ts`). Four fallback functions exist: `directXmlReplaceCode` (255-300), `directXmlModifyProperty` (317-360), `directXmlAddControl` (457-523), `directXmlAddMenuItemToMenu` (369-409). These are guarded, not naive:
- Occurrence counting — refuses to apply a replacement if the target snippet/tag appears 0 or >1 times (ambiguity rejection), e.g. `modifyD365File.ts:277-283` for `directXmlReplaceCode`.
- Idempotency check for control-add (`directXmlAddControl:472`) — skips silently if the control already exists.
- XML-escaping of injected values (`&`, `<`, `>`) before insertion (`directXmlModifyProperty:325-326`).
- `normalizeD365Xml()` ([src/utils/d365XmlNormalizer.ts:28-43]) is applied after every fallback write, restoring D365FO's canonical on-disk format (no BOM, CRLF, no trailing newline) — empirically derived from scanning ~106K OOB XML files, documented in the function's own comment.

### 3.2 Pre-write validation

Before any write is committed, `modifyD365File.ts` runs (in order, ~lines 858-1227):
1. XML-entity decoding of pasted code (`decodeXmlEntitiesFromXppSource`).
2. `assertCleanXppSource()` (98-119) — rejects source containing the CDATA terminator `]]>` or stray structural tags (`</Source>`, `<Method>`, `<![CDATA[`), which would otherwise corrupt the CDATA-wrapped method body.
3. `assertSingleMethodSource()` (219-231) — rejects multiple method bodies in one `modify` call (except for `add-method`, which explicitly splits and adds them one at a time).
4. `gateOnReferenceErrors()` (903) — semantic validation of every identifier in the source against the symbol index, rejecting code that references non-existent types/tables/classes.
5. `assertWritePathAllowed()` / path containment guard (1064-1074) — refuses to write outside the configured `PackagesLocalDirectory` root(s), blocking path traversal.
6. A standard-model guard (1076-1095) — refuses to modify objects resolved to Microsoft's own models (ApplicationSuite, ApplicationFoundation, etc.) unless the user's configured model explicitly matches, steering the caller toward creating an extension instead.
7. Optional form-pattern pre-flight (`checkAddControlAgainstParentPattern`, 1001-1046) — blocks adding a control type not allowed by the parent container's mined form pattern.
8. Optional grounding-token enforcement (891-898) for `*-extension` object types, requiring a prior `prepare` call.

### 3.3 Concurrency and post-write checks

`src/utils/operationLocks.ts` (`withOperationLock`, 123-155) combines an in-process Promise queue with a filesystem-backed lock directory under `os.tmpdir()`, so concurrent MCP calls — even from separate Node processes — serialize on the same lock key. Stale locks are detected either by checking whether the owning PID is still alive or by a 20-minute age fallback (50-82).

Post-write verification is delegated to the bridge: after a create/modify, the bridge re-reads the object via the same SDK path used to write it, so a corrupt/invalid write would surface as a read failure rather than silently succeeding. There is no independent XSD schema validation step in either path.

### 3.4 Undo / rollback

`src/tools/undoLastModification.ts` reverts a file via `git checkout` (tracked files) or deletion (untracked files just created), then triggers a symbol re-index. An optional `.bak` backup (`createBackup: true` param, default `false`) is available for files not under source control. `src/utils/provenanceStore.ts` issues short-lived (30-minute) "grounding tokens" that prove a `prepare` call inspected the real object before an extension write was allowed — this is a safety gate on *intent*, not a data-corruption safeguard.

---

## 4. Build/sync/test integration

All four tools below are invoked directly from the **Node process** via `child_process.spawn`/`execFile` (no shell, arguments passed as an array) — **not** via the C# bridge, and **not** via MSBuild. `assertSafePath()` sanitizes path/model-name arguments before they reach `spawn`/`execFile` in each of these tools.

**Build — `xppc.exe`** ([src/tools/buildProject.ts:457-631]): resolved from `{packagesRoot}/Bin/xppc.exe` (via XPP config → `.mcp.json` context → well-known-drive probing). Invoked with:
```
-metadata={customPackagesPath} -compilermetadata={microsoftPackagesPath} -modelmodule={modelName}
-referenceFolder=... (deduped) -output={customPackagesPath}/{modelName}/bin
[-incremental unless fullBuild] -log={xppcErrLog} -verbose
```
stdout/stderr piped to a log file; a separate `-log` diagnostics file is the authoritative error source because `xppc` can exit 0 even when it emitted `Compile Error:` lines (buildProject.ts:540-544). A regex parser (`XPPC_DIAG_LINE_RE`, 73-105) extracts structured `{severity, kind, model, object, member, line, column, message}` records from lines like `Compile Error: Class Method dynamics://Model/Class/method: [(28,27),(28,28)]: ';' expected.` — deduplicated and capped to 25 items in the formatted response, with the first 3 distinct errors enriched from a known-fix knowledge base. Default tool-level wait timeout is 30 minutes.

**DB sync — `SyncEngine.exe`** (`src/tools/dbSync.ts`): `-syncmode={FullAll|FullAllAndViews|PartialList} -metadatabinaries={packagesRoot} -connect={connectionString} [-verbosediagnostics | -synclist=... -viewlist=...]`. Timeout 15 min (partial) / 60 min (full); output buffered with a 2MB-per-stream cap and truncated to 8,000 chars in the client response; error detection via regex on "error|failed|exception" with a false-positive filter for "0 error". Global lock key `'dbsync'` — only one sync can run at a time.

**Unit tests — `SysTestConsole.exe`/`SysTestRunner.exe`** (`src/tools/sysTestRunner.ts`): resolved primary `SysTestConsole.exe /test:{className} /xml:{tempPath}`, legacy fallback `SysTestRunner.exe -name:{className}[::{method}] -packagePath:... -model:...`. Results parsed from the generated XML file, falling back to stdout/stderr regex matching for pass/fail. Timeout 5 minutes, per-model-per-class lock. **Documented limitation**: `SysTestConsole.exe` unconditionally calls `Console.ReadKey()`, so it hangs/fails in non-interactive (headless CI) sessions — confirmed by `eval/ROADMAP.md` marking 3 eval cases `systest_pending: true` for this exact reason.

**Best Practice checker — `xppbp.exe`** (`src/tools/runBpCheck.ts`): three fallback argument styles are tried in sequence to handle cross-version `xppbp.exe` CLI differences (colon-separated `-metadata:`, equals-separated `-metadata=`, and a `-packagesRoot:` variant), reflecting real-world fragility in this tool's CLI across D365FO versions. Timeout 5 minutes, per-model lock.

---

## 5. Report/SSRS support

**Verdict: PRESENT — not partial, not absent.** This was double-checked directly (not just via the research agent) — [src/tools/generateSmartReport.ts](src/tools/generateSmartReport.ts) is 1,465 lines and [src/tools/reportInfo.ts](src/tools/reportInfo.ts) is 371 lines, both real implementations, not stubs.

- `generateSmartReport.ts` generates up to 7 D365FO objects in one call: TmpTable (temp DB table), Contract class, DP class (`SrsReportDataProviderBase`/`SrsReportDataProviderPreProcess`), optional Controller class, optional output menu item, and an `AxReport` with embedded RDL — wired into the `generate_object(mode="scaffold")` dispatcher, and `pattern: 'ssrs-report-full'` is a listed enum value in [src/server/toolSchemas/generateObject.ts:~30].
- `createD365File.ts:903-1173` contains `XmlTemplateGenerator.generateAxReportXml()`, producing multi-dataset AxReport XML with RDL page-header injection (`injectRdlPageHeader`, 1137-1172) and a grouped-Tablix pattern (`injectGroupedTablix`, 1174-1213).
- `reportInfo.ts` reads AxReport metadata (bridge-first, with an explicit-XML fallback), parsing `AxReportDataSet`/`AxReportDataSetField` entries and embedded RDL. Wired into `objectInfoRegistry.ts:82` (`'report'` type) and into `get_object_info`/`batch_get_info`'s type lists.
- `eval/cases/L4-ssrs-report-basic.json` and `L4-ssrs-report-advanced.json` have corresponding golden output directories (`eval/goldens/L4-ssrs-report-basic/`, `.../L4-ssrs-report-advanced/`) containing real generated XML — including a 457-line AxReport file with valid CDATA-embedded 2016-schema RDL (DataSources, DataSets, ReportParameters, Tablix, PageHeader) — these are not empty fixtures.
- **Documented gap**: `eval/ROADMAP.md:26-30` states the `additionalDatasets` parameter is implemented internally in `generateSmartReport.ts` but **not exposed** in the MCP tool's JSON schema — multi-dataset reports are reachable in code but not through the tool interface as published.

So: report/SSRS generation is a first-class, tested capability of this repo — this is a meaningfully different picture from a typical "X++ codegen tool" scope and should inform the fit assessment below.

---

## 6. Gaps and risks

**Hardcoded paths / drive letters** (HIGH — breaks outside author's exact setup):
- `extract-metadata.ts:14` defaults to `C:\AOSService\PackagesLocalDirectory`; `build-database.ts:14` and `build-fts.ts:15` default to `K:\AosService\PackagesLocalDirectory` — inconsistent defaults across the three pipeline scripts.
- `src/bridge/bridgeClient.ts:47-49` hardcodes a two-entry fallback probe list (`C:\...`, `K:\...`).
- `src/tools/buildProject.ts:~273` hardcodes an xppc.exe path under `C:\AOSService\...` in its search/error messaging.
- `src/tools/generateMetadata.ts:129-130` hardcodes `csc.exe` paths under `C:\Windows\Microsoft.NET\Framework(64)\v4.0.30319\` — .NET Framework 4.0 specifically, which is old even by D365FO standards.

**Platform lock-in** (HIGH by design, but worth flagging for a fork): almost the entire write/build/sync/test surface is Windows-only — `xppc.exe`, `SyncEngine.exe`, `SysTestConsole.exe`, `xppbp.exe`, and the `net48` C# bridge all require Windows. Non-Windows clients are explicitly detected (`process.platform !== 'win32'`) and degrade to text-only output rather than failing outright — this is handled gracefully, but it means only the Azure `read-only` deployment is realistically cross-platform.

**SQL Server xref hardcoded to `localhost`**: the bridge's cross-reference database defaults to `localhost` with a CLI flag override but no first-class remote-hybrid config path — noted as a gap for distributed/hybrid deployments.

**Dependency fragility**: the git log shows recent, repeated lockfile-drift fixes (`8f298ac` "add @emnapi/core+runtime to lock file", `1b6c674` "pin @rolldown/binding-wasm32-wasi to prevent lock drift", plus a preceding "npm lockfile sync" merge) — three lockfile-repair PRs in quick succession is a signal of real, recurring transitive-dependency instability, likely from `better-sqlite3`'s native build chain and/or `tsx`/`vitest`'s WASM-based toolchain. `better-sqlite3` itself requires a native compile step (Python + C++ toolchain on Windows), a common first-install failure point.
- Most first-party dependencies are caret-ranged (`^`) in `package.json`, so `npm install` without a fresh `package-lock.json` can resolve different transitive versions over time.

**No incremental re-indexing** (§2.5): any metadata change to a "custom" or "standard" model bucket triggers a full XML rescan of every file in that bucket — there is no file-hash/mtime diffing. For iterative development this means re-running `index-metadata` after every schema change is expensive, not free.

**Interactive-console dependency for SysTest automation**: `SysTestConsole.exe`'s unconditional `Console.ReadKey()` makes `run_systest_class` unusable from a truly headless CI runner — acknowledged by the project's own eval roadmap (3 test cases marked `systest_pending`).

**Single bridge instance per server process, singleton config**: `src/utils/configManager.ts` documents its runtime-context object as an intentional singleton "to prevent workspace paths from bleeding" between requests — implying this was a real bug class the author hit, and that multi-instance/multi-tenant scenarios need the documented `ENV_FILE` workaround rather than being natively safe.

**Bridge must be compiled per machine**: `bridge/D365MetadataBridge` is built locally (`dotnet build`) against whatever D365FO assemblies exist in the local `PackagesLocalDirectory\bin`; there's no distributable pre-built binary, and the assembly reference glob ([D365MetadataBridge.csproj:59]) means a mismatched/corrupt bin folder silently picks up whatever DLL versions are present rather than pinning to a known-good version.

**xppbp.exe CLI fragility**: `run_bp_check` needs three different argument-style fallbacks to work across xppbp.exe versions — direct evidence that Microsoft's own CLI tooling isn't stable across D365FO releases, which is a risk for any code built on top of it, not just this project's choice.

**License**: [LICENSE](LICENSE) is the standard MIT License text, copyright "2026 dynamics365ninja". `package.json`'s `"license": "MIT"` field matches. No conflicting license claims found elsewhere in the repo or README.

---

## 7. Fit assessment (for forking as the grounding/indexing/write layer)

**Usable largely as-is:**
- The SQLite indexing pipeline (§2) is a solid, already-comprehensive metadata graph — tables, forms, EDTs, extensions, security, menu items, services — and already captures most of what a "grounding" layer needs (symbol lookup, CoC/extension reverse-lookup, form-pattern mining). The FTS5 setup and composite indexes are production-grade, not a toy schema.
- XML write safety (§3) is genuinely robust for the primary (bridge) path — real object-model mutation via Microsoft's SDK, with meaningful pre-write guards (path containment, standard-model protection, reference validation, CDATA-corruption detection) on the fallback path. This is safe to build on without a rewrite.
- Report/SSRS generation (§5) is a bonus that directly matches "eventually report generation" in the stated goal — the RDL generation, Contract/DP/Controller scaffolding, and AxReport XML templating can likely be extended rather than built from scratch.
- The 26-tool dispatcher pattern (one MCP tool per category, `mode`/`action`-routed internally) is a reasonable API shape to extend with new functional-design-reasoning tools without blowing up the top-level tool count (MCP clients often have soft limits on advertised tools).

**Needs modification:**
- **No incremental indexing.** If the broader agent needs fast iterative re-grounding after small metadata edits (e.g., after the write layer itself makes a change), the current full-rescan-per-bucket model will be a bottleneck. This needs a hash/mtime-based delta path added.
- **No relational join layer.** Table relations, form datasources, and menu-item targets are stored as flat, unjoined tables — a functional-design-reasoning layer (e.g., "what workflow touches this field") would need a new query/graph layer on top, not present today.
- **EDT inheritance is single-level only.** A reasoning layer that needs the full inheritance chain (for lifecycle/field semantics) will need to add transitive resolution.
- **Windows/D365FO-VM coupling for anything beyond read+generate-text.** If the broader agent is meant to run centrally (e.g., in Azure or a container) and reach out to multiple customer VMs, the current 1:1 "bridge is a local child process" model doesn't generalize — it would need to become a real network service with auth, not a spawned stdio subprocess.

**Should be ripped out or reconsidered:**
- The multiple hardcoded `C:\`/`K:\` fallback paths (§6) should be removed/normalized — they're relics of the author's own dev environment and will actively mislead a forked deployment.
- The inconsistent default drive letters between `extract-metadata.ts` (`C:`) and `build-database.ts`/`build-fts.ts` (`K:`) is a latent bug worth fixing early, since a fork is likely to hit it on first run without every env var set.
- `SysTestConsole.exe`'s interactive-console requirement means the current `run_systest_class` tool can't be trusted for CI/agent-driven test execution as-is; if automated test execution matters to the broader agent, this needs a `vstest.console.exe`-based rework (which Microsoft documents as the non-interactive alternative, per the project's own findings) rather than reuse of the current implementation.
- The provenance/grounding-token mechanism (`provenanceStore.ts`) is a reasonable pattern to keep, but it's currently scoped narrowly to "did you call `prepare` before writing an extension" — a broader functional-reasoning agent will likely want a richer provenance model (what design decision led to this field/workflow choice), so treat this as a starting point to extend, not a finished subsystem.
