// src/utils/loadEnv.ts
import dotenv from "dotenv";
import { existsSync as existsSync2, readFileSync as readFileSync2, statSync } from "fs";
import { dirname as dirname2, isAbsolute as isAbsolute2, join as join2, resolve as resolve2 } from "path";
import { fileURLToPath } from "url";

// src/config/configFile.ts
import * as fs from "node:fs";
import { basename, dirname, isAbsolute, join, resolve } from "node:path";

// src/config/settings.ts
var SETTINGS = [
  // ── environment ──────────────────────────────────────────────────────────
  {
    path: "environment.type",
    env: "D365FO_DEV_ENVIRONMENT_TYPE",
    section: "environment",
    tier: "basic",
    type: "enum",
    label: "Development environment type",
    description: 'Classic AOSService VM ("traditional") or Unified Developer Experience / Power Platform Tools ("ude"). The wizard preselects the one it detects \u2014 UDE when XPP config files exist in %LOCALAPPDATA%\\Microsoft\\Dynamics365\\XPPConfig. Left unset, the server falls back to that same detection.',
    choices: [
      { value: "traditional", hint: "classic AOSService VM with PackagesLocalDirectory" },
      { value: "ude", hint: "Unified Developer Experience / Power Platform Tools" }
    ]
  },
  {
    path: "environment.packagePath",
    env: "D365FO_PACKAGE_PATH",
    section: "environment",
    tier: "basic",
    type: "path",
    label: "Packages root (PackagesLocalDirectory)",
    description: "AOT packages folder (PackagesLocalDirectory) used as the read-only source for indexing. Machine-wide on a traditional VM; UDE resolves it from the XPP config instead. Left empty, the server scans the machine's drives for AosService\\PackagesLocalDirectory \u2014 which volume that is depends on the VM image (K:, C:, J:, \u2026).",
    placeholder: "C:\\AOSService\\PackagesLocalDirectory"
  },
  {
    path: "environment.customModels",
    env: "CUSTOM_MODELS",
    section: "environment",
    tier: "basic",
    type: "list",
    label: "Custom model names",
    description: "Your own (non-Microsoft) models, comma-separated. They are indexed with priority and treated as writable. Find them in VS \u2192 Dynamics 365 \u2192 Model Management \u2192 View models. UDE detects these automatically.",
    placeholder: "ContosoRobotics,ContosoBank"
  },
  {
    path: "environment.xppConfigName",
    env: "XPP_CONFIG_NAME",
    section: "environment",
    tier: "basic",
    type: "string",
    label: "XPP config to pin (UDE)",
    description: "Name of a config file in %LOCALAPPDATA%\\Microsoft\\Dynamics365\\XPPConfig. Pinning one keeps the server on a specific environment/version; leave empty to always use the newest config."
  },
  {
    path: "environment.customPackagesPath",
    env: "D365FO_CUSTOM_PACKAGES_PATH",
    section: "environment",
    tier: "advanced",
    type: "path",
    label: "Custom X++ root (UDE ModelStoreFolder)",
    description: "Where custom model XML is written and tracked by git. Normally read from the XPP config \u2014 override only when your working tree lives somewhere else."
  },
  {
    path: "environment.microsoftPackagesPath",
    env: "D365FO_MICROSOFT_PACKAGES_PATH",
    section: "environment",
    tier: "advanced",
    type: "path",
    label: "Microsoft X++ root (UDE FrameworkDirectory)",
    description: "Read-only Microsoft packages folder. Normally read from the XPP config."
  },
  // ── workspace ────────────────────────────────────────────────────────────
  {
    path: "workspace.modelName",
    env: "D365FO_MODEL_NAME",
    section: "workspace",
    tier: "basic",
    type: "string",
    label: "Target model for code generation",
    description: "The model new objects are created in. Leave empty to let the server detect it from the IDE workspace or the .rnrproj file \u2014 set it explicitly when one server instance always serves one model."
  },
  {
    path: "workspace.path",
    env: "D365FO_WORKSPACE_PATH",
    section: "workspace",
    tier: "basic",
    type: "path",
    label: "Workspace path (\u2026\\PackagesLocalDirectory\\<Package>\\<Model>)",
    description: "Two-level AOT path of the model being worked on. Used to resolve the package root and the write target when the IDE does not report a workspace.",
    placeholder: "K:\\AosService\\PackagesLocalDirectory\\YourPackage\\YourModel"
  },
  {
    path: "workspace.solutionsPath",
    env: "D365FO_SOLUTIONS_PATH",
    section: "workspace",
    tier: "basic",
    type: "path",
    label: "Folder scanned for .rnrproj projects",
    description: "Scanned once at startup so the server can switch model automatically when you open another solution or git branch. Optional, but it is what makes multi-project workspaces work without reconfiguring.",
    placeholder: "K:\\repos\\MySolution\\projects"
  },
  {
    path: "workspace.projectPath",
    env: "D365FO_PROJECT_PATH",
    section: "workspace",
    tier: "advanced",
    type: "path",
    label: "Pinned .rnrproj file",
    description: "Forces one specific project instead of auto-detection. Rarely needed outside CI."
  },
  {
    path: "workspace.solutionPath",
    env: "D365FO_SOLUTION_PATH",
    section: "workspace",
    tier: "advanced",
    type: "path",
    label: "Pinned .sln file",
    description: "Forces one specific solution instead of auto-detection. Rarely needed outside CI."
  },
  {
    env: "D365FO_CROSS_MODEL_WRITE_MODELS",
    section: "workspace",
    tier: "env-only",
    type: "list",
    label: "Models this workspace may also write into",
    description: "Comma-separated models this workspace may write into besides its own. By default any create/modify/label write into another custom model is refused and the extension route in the active model is offered instead \u2014 see [Objects owned by another model](CUSTOM_EXTENSIONS.md#objects-owned-by-another-model). Consent lives here, in configuration, because a tool parameter is something the agent can grant itself. Re-read from `.env` before every decision, so an edit applies to the next attempt without a restart."
  },
  {
    env: "D365FO_ALLOW_CROSS_MODEL_WRITE",
    section: "workspace",
    tier: "env-only",
    type: "boolean",
    label: "Allow writes into any other custom model",
    description: "Set to `true` to allow writes into **any** other custom model \u2014 the blanket form of the setting above.",
    default: false
  },
  // ── naming ───────────────────────────────────────────────────────────────
  {
    path: "naming.prefix",
    env: "EXTENSION_PREFIX",
    section: "naming",
    tier: "basic",
    type: "string",
    label: "Extension prefix for custom objects",
    description: "Your ISV/customer prefix. Prepended to every generated object, field and method name and enforced by the naming validator, so BP checks pass on the first build. Used as the **fallback**: when the active model's existing objects already show a prefix, that one wins \u2014 see [Where the prefix comes from](CUSTOM_EXTENSIONS.md#where-the-prefix-comes-from).",
    placeholder: "ISV_",
    required: true
  },
  {
    path: "naming.prefixSource",
    env: "EXTENSION_PREFIX_SOURCE",
    section: "naming",
    tier: "advanced",
    type: "enum",
    label: "Where the prefix comes from",
    description: "Whether the effective prefix is learned from the active model's own objects or pinned to the configured `naming.prefix`. Pin it when one model carries several feature prefixes that share a stem \u2014 inference learns the shared stem, while the objects you write need the full one. See [Where the prefix comes from](CUSTOM_EXTENSIONS.md#where-the-prefix-comes-from).",
    default: "model",
    choices: [
      { value: "model", hint: "the model's own objects decide, falling back to naming.prefix" },
      { value: "config", hint: "always naming.prefix, inference off (pre-1.8.2 behaviour)" }
    ]
  },
  {
    path: "naming.suffix",
    env: "EXTENSION_SUFFIX",
    section: "naming",
    tier: "advanced",
    type: "string",
    label: "Extension suffix",
    description: 'Optional suffix appended to new object names (MyTableZZ with suffix "ZZ"). Most projects use only a prefix \u2014 leave empty unless your convention requires one.'
  },
  {
    path: "naming.extensionStyle",
    env: "EXTENSION_NAMING_STYLE",
    section: "naming",
    tier: "advanced",
    type: "enum",
    label: "How extension elements are named",
    description: "Whether extension classes/elements embed the prefix (per the Microsoft prefix guideline) or the model name (the Visual Studio default). Use model-name when your model name is long but your prefix is a short abbreviation.",
    default: "prefix",
    choices: [
      { value: "prefix", hint: "CustTable.CrExtension \u2014 embeds the extension prefix" },
      { value: "model-name", hint: "CustTable.ContosoRobotics \u2014 embeds the model name (VS default)" }
    ]
  },
  // ── index ────────────────────────────────────────────────────────────────
  {
    path: "index.extractMode",
    env: "EXTRACT_MODE",
    section: "index",
    tier: "basic",
    type: "enum",
    label: "What to index",
    description: 'Scope of the metadata extraction. "all" gives full cross-reference search over the standard application but takes 1\u20132 hours and produces a multi-GB database; "custom" indexes only your own models and finishes in minutes.',
    default: "all",
    choices: [
      { value: "all", hint: "standard + custom \u2014 full search, 1\u20132 h build" },
      { value: "custom", hint: "custom models only \u2014 minutes" },
      { value: "standard", hint: "Microsoft models only" }
    ]
  },
  {
    path: "index.includeLabels",
    env: "INCLUDE_LABELS",
    section: "index",
    tier: "basic",
    type: "boolean",
    label: "Index label files",
    description: 'Builds the labels database so labels(action="search") and label reuse work. Disabling it speeds up the build and shrinks the index, at the cost of label lookup.',
    default: true
  },
  {
    path: "index.labelLanguages",
    env: "LABEL_LANGUAGES",
    section: "index",
    tier: "basic",
    type: "list",
    label: "Label languages to index",
    description: "Comma-separated language codes, or `all` for every language shipped with the model. Each extra language multiplies the label table (~125 MB apiece) \u2014 indexing only the languages you actually ship keeps the database small.",
    // src/metadata/labelParser.ts reads this default straight off the registry:
    // it used to carry its own 'en-US,cs,sk,de' literal, so an unconfigured
    // build silently indexed four languages while this table promised one.
    default: ["en-US"],
    placeholder: "en-US,cs,de"
  },
  {
    path: "index.dbPath",
    env: "DB_PATH",
    section: "index",
    tier: "advanced",
    type: "path",
    label: "Metadata database file",
    description: "SQLite file holding the indexed X++ metadata. Relative paths resolve from the config file directory.",
    default: "./data/xpp-metadata.db"
  },
  {
    path: "index.labelsDbPath",
    env: "LABELS_DB_PATH",
    section: "index",
    tier: "advanced",
    type: "path",
    label: "Labels database file",
    description: "Second SQLite file for labels (dual-database architecture keeps label writes from locking metadata reads). Defaults to <dbPath>-labels.db.",
    default: "./data/xpp-metadata-labels.db"
  },
  {
    path: "index.metadataPath",
    env: "METADATA_PATH",
    section: "index",
    tier: "advanced",
    type: "path",
    label: "Extracted XML folder",
    description: "Working folder for the XML dumped during extraction, before it is loaded into the database.",
    default: "./extracted-metadata"
  },
  {
    path: "index.labelSortOrder",
    env: "LABEL_SORT_ORDER",
    section: "index",
    tier: "advanced",
    type: "enum",
    label: "Where new labels are inserted",
    description: "Alphabetical keeps .label.txt files sorted (smaller diffs, matches most teams); append adds new labels at the end of the file (preserves manual grouping).",
    default: "alphabetical",
    choices: [
      { value: "alphabetical", hint: "insert in sorted position" },
      { value: "append", hint: "add at the end of the file" }
    ]
  },
  {
    path: "index.computeStats",
    env: "COMPUTE_STATS",
    section: "index",
    tier: "advanced",
    type: "boolean",
    label: "Compute usage statistics during build",
    description: "Adds per-object usage counts used for ranking. Noticeably slows down large builds.",
    default: false
  },
  // ── server ───────────────────────────────────────────────────────────────
  {
    path: "server.mode",
    env: "MCP_SERVER_MODE",
    section: "server",
    tier: "advanced",
    type: "enum",
    label: "Server mode",
    description: 'Which half of the toolset this process exposes. "full" is a single local server; the hybrid deployment splits into an Azure "read-only" instance plus a local "write-only" companion that owns the C# bridge.',
    default: "full",
    choices: [
      { value: "full", hint: "all tools \u2014 single local server" },
      { value: "read-only", hint: "search/inspect only \u2014 Azure-hosted shared index" },
      { value: "write-only", hint: "create/modify/build only \u2014 local companion" }
    ]
  },
  {
    path: "server.toolProfile",
    env: "MCP_TOOL_PROFILE",
    section: "server",
    tier: "advanced",
    type: "enum",
    label: "Tool profile",
    description: 'How many tools this server advertises. "full" publishes all 23. "core" publishes only the plan \u2192 discover \u2192 write \u2192 build \u2192 verify loop (18 tools) and leaves out the specialist ones (extension_info, analyze_code, validate_code, security_info, run_systest_class). Worth switching when the workspace runs several MCP servers at once: hosts stop sending the tool catalogue inline past a limit (VS Code: ~100 tools) and make the model search for tools first, which costs a round trip per tool.',
    default: "full",
    choices: [
      { value: "full", hint: "all 23 tools" },
      { value: "core", hint: "18-tool create-and-build loop" }
    ]
  },
  {
    path: "server.extraTools",
    env: "MCP_EXTRA_TOOLS",
    section: "server",
    tier: "advanced",
    type: "list",
    label: "Extra tools on top of the core profile",
    description: 'Tool names to publish in addition to the core profile, e.g. security_info,run_systest_class. Ignored when the tool profile is "full".',
    placeholder: "security_info,run_systest_class"
  },
  {
    path: "server.port",
    env: "PORT",
    section: "server",
    tier: "basic",
    type: "int",
    label: "HTTP port",
    description: "Port for the HTTP transport. Only relevant when clients connect over http://localhost:<port>/mcp/ \u2014 an IDE that spawns the server itself uses stdio and ignores this.",
    default: 8080
  },
  {
    path: "server.host",
    env: "HOST",
    section: "server",
    tier: "advanced",
    type: "string",
    label: "HTTP bind address",
    description: "Interface the HTTP transport binds to. Left unset it follows the API key: 0.0.0.0 once a key (or ALLOW_UNAUTHENTICATED) is configured, which is what a container or App Service needs, and 127.0.0.1 when neither is, so an unauthenticated server stays off the network. Setting it to a public interface without a key is refused at startup.",
    default: "0.0.0.0"
  },
  {
    path: "server.shutdownTimeoutMs",
    env: "SHUTDOWN_TIMEOUT_MS",
    section: "server",
    tier: "advanced",
    type: "int",
    label: "Graceful shutdown deadline (ms)",
    description: "How long SIGTERM/SIGINT handling waits for in-flight work (bridge writes, database checkpoints) before the process exits anyway. Clamped to a minimum of 1000.",
    default: 5e3
  },
  {
    env: "OPERATION_LOCK_HEARTBEAT_MS",
    section: "server",
    // env-only: the lock holder reads this at acquire time in a process the
    // wizard never configures, so a JSON key would misrepresent when a change
    // takes effect.
    tier: "env-only",
    type: "int",
    label: "Operation-lock heartbeat interval (ms)",
    description: "How often the holder of a long-running operation lock (build, DB sync) touches it so the stale-lock reaper can tell a live owner from an abandoned one. Lower it only if a reaper is killing locks that are still working; the reaper already refuses to age out a lock whose owner pid is alive.",
    default: 6e4
  },
  {
    path: "server.debugLogging",
    env: "DEBUG_LOGGING",
    section: "server",
    tier: "advanced",
    type: "boolean",
    label: "Verbose debug logging",
    description: "Prints per-step diagnostics to stderr. Useful when a tool misbehaves; noisy otherwise.",
    default: false
  },
  {
    path: "server.logFile",
    env: "LOG_FILE",
    section: "server",
    tier: "advanced",
    type: "path",
    label: "Mirror stderr to a log file",
    description: "Absolute path; the server appends everything it writes to stderr. The way to get logs out of an IDE that hides MCP subprocess output."
  },
  {
    path: "server.forceHttp",
    env: "MCP_FORCE_HTTP",
    section: "server",
    tier: "advanced",
    type: "boolean",
    label: "Force HTTP transport",
    description: "The server picks stdio when its stdin is piped. Set this to keep HTTP anyway \u2014 e.g. when running under a process supervisor that pipes stdin.",
    default: false
  },
  {
    path: "server.toolTimeoutMs",
    env: "MCP_TOOL_TIMEOUT_MS",
    section: "server",
    tier: "advanced",
    type: "int",
    label: "Default tool timeout (ms)",
    description: "Upper bound for a single tool call before the server returns a timeout error.",
    default: 12e4
  },
  {
    path: "server.apiKeyCacheTtlMs",
    env: "API_KEY_CACHE_TTL_MS",
    section: "server",
    tier: "advanced",
    type: "int",
    label: "Customer API key cache TTL (ms)",
    description: "How long a per-customer key lookup is trusted before Neon is consulted again. This IS the revocation delay: a revoked key keeps working for up to this long on an already-running instance. Lower it when immediate cutoff matters more than latency; 0 disables caching and costs a query per request.",
    default: 6e4
  },
  {
    path: "server.toolTimeoutFastMs",
    env: "MCP_TOOL_TIMEOUT_FAST_MS",
    section: "server",
    tier: "advanced",
    type: "int",
    label: "Fast-tool timeout (ms)",
    description: "Timeout for lookups that should always be quick (minimum 5000).",
    default: 3e4
  },
  {
    path: "server.toolTimeoutHeavyMs",
    env: "MCP_TOOL_TIMEOUT_HEAVY_MS",
    section: "server",
    tier: "advanced",
    type: "int",
    label: "Heavy-tool timeout (ms)",
    description: "Timeout for builds, DB sync and test runs (minimum 60000). Raise it on slow VMs.",
    default: 6e5
  },
  {
    path: "server.readPoolSize",
    env: "READ_POOL_SIZE",
    section: "server",
    tier: "advanced",
    type: "int",
    label: "SQLite read connections",
    description: "Parallel read connections to the index (clamped 1\u20138). More helps concurrent searches on fast disks.",
    default: 3
  },
  {
    path: "server.operationLockTimeoutMs",
    env: "OPERATION_LOCK_TIMEOUT_MS",
    section: "server",
    tier: "advanced",
    type: "int",
    label: "Wait for a conflicting operation (ms)",
    description: "How long a build/sync waits for another one to finish before failing.",
    default: 9e5
  },
  {
    path: "server.operationLockPollMs",
    env: "OPERATION_LOCK_POLL_MS",
    section: "server",
    tier: "advanced",
    type: "int",
    label: "Lock poll interval (ms)",
    description: "How often the waiting process re-checks the lock.",
    default: 250
  },
  {
    path: "server.operationLockStaleMs",
    env: "OPERATION_LOCK_STALE_MS",
    section: "server",
    tier: "advanced",
    type: "int",
    label: "Lock considered abandoned after (ms)",
    description: "A lock older than this is treated as left behind by a crashed process and broken.",
    default: 12e5
  },
  {
    path: "server.slowCallLogMs",
    env: "SLOW_CALL_LOG_MS",
    section: "server",
    tier: "advanced",
    type: "int",
    label: "Log a tool call slower than (ms)",
    description: "Writes one line per tool call that exceeds this, with the tool name and a short argument digest. Aggregate metrics cannot say which specific call cost five minutes; this can. Set LOG_FILE to keep the lines.",
    default: 1e4
  },
  // ── bridge ───────────────────────────────────────────────────────────────
  {
    path: "bridge.readyTimeoutMs",
    env: "BRIDGE_READY_TIMEOUT_MS",
    section: "bridge",
    tier: "advanced",
    type: "int",
    label: "Bridge startup timeout (ms)",
    description: "Time allowed for the metadata provider to initialise. Raise it on large installations.",
    default: 3e4
  },
  {
    path: "bridge.callTimeoutMs",
    env: "BRIDGE_CALL_TIMEOUT_MS",
    section: "bridge",
    tier: "advanced",
    type: "int",
    label: "Bridge call timeout (ms)",
    description: "Per-request timeout for a single bridge call. Big searches on slow VMs may need more.",
    default: 6e4
  },
  {
    path: "bridge.maxRetries",
    env: "BRIDGE_MAX_RETRIES",
    section: "bridge",
    tier: "advanced",
    type: "int",
    label: "Retries for read calls",
    description: "Read calls are retried after a health-checked restart of the child process. Writes are never retried \u2014 a timed-out write may already have been applied. 0 disables retries.",
    default: 2
  },
  {
    path: "bridge.healthcheckMs",
    env: "BRIDGE_HEALTHCHECK_MS",
    section: "bridge",
    tier: "advanced",
    type: "int",
    label: "Idle ping interval (ms)",
    description: "Proactively detects a wedged bridge while idle. 0 disables the ping.",
    default: 0
  },
  {
    path: "bridge.maxRestarts",
    env: "BRIDGE_MAX_RESTARTS",
    section: "bridge",
    tier: "advanced",
    type: "int",
    label: "Max restarts per minute",
    description: "Circuit breaker: after this many respawns within 60 s the server stops trying.",
    default: 3
  },
  {
    path: "bridge.exePath",
    env: "D365FO_BRIDGE_EXE_PATH",
    section: "bridge",
    tier: "advanced",
    type: "path",
    label: "Bridge executable",
    description: "Absolute path to D365MetadataBridge.exe. Leave empty to auto-detect inside the installation \u2014 the setup wizard fills this in for an npm install, where the binary is built outside the package so that updating the package does not delete it."
  },
  {
    path: "bridge.logFile",
    env: "D365FO_BRIDGE_LOG_FILE",
    section: "bridge",
    tier: "advanced",
    type: "path",
    label: "Bridge diagnostic log",
    description: "Absolute path the C# bridge appends its own diagnostics to."
  },
  {
    path: "bridge.fsScanTimeoutMs",
    env: "D365FO_FS_SCAN_TIMEOUT_MS",
    section: "bridge",
    tier: "advanced",
    type: "int",
    label: "Filesystem fallback scan timeout (ms)",
    description: "Budget for the filesystem scan used when the bridge cannot answer an extension lookup (minimum 500).",
    default: 3e3
  },
  {
    path: "bridge.disableFsFallback",
    env: "D365FO_DISABLE_FS_FALLBACK",
    section: "bridge",
    tier: "advanced",
    type: "boolean",
    label: "Disable the filesystem fallback",
    description: "Makes extension lookups bridge-only. Turn on to diagnose stale-index issues \u2014 results get stricter, not faster.",
    default: false
  },
  // ── behavior ─────────────────────────────────────────────────────────────
  {
    path: "behavior.formPatternEnforce",
    env: "FORM_PATTERN_ENFORCE",
    section: "behavior",
    tier: "advanced",
    type: "boolean",
    label: "Block form writes that break the pattern",
    description: "Structural form-pattern violations (unknown pattern, missing container, wrong control order) block the write. Disable to log them as warnings instead.",
    default: true
  },
  {
    path: "behavior.groundingEnforce",
    env: "GROUNDING_ENFORCE",
    section: "behavior",
    tier: "advanced",
    type: "boolean",
    label: "Require grounding tokens for writes",
    description: "Write tools only accept a token issued by prepare(), proving the model actually inspected the real object before generating code. Strongly recommended for agent use; adds one extra call per write.",
    default: false
  },
  // ── azure ────────────────────────────────────────────────────────────────
  {
    path: "azure.blobContainer",
    env: "BLOB_CONTAINER_NAME",
    section: "azure",
    tier: "advanced",
    type: "string",
    label: "Blob container with the index",
    description: "Container the pre-built database is downloaded from at startup.",
    default: "xpp-metadata"
  },
  {
    path: "azure.blobDatabase",
    env: "BLOB_DATABASE_NAME",
    section: "azure",
    tier: "advanced",
    type: "string",
    label: "Blob name of the database",
    description: "Path of the database blob inside the container.",
    default: "databases/xpp-metadata-latest.db"
  },
  // ── secrets (config/secrets.json) ────────────────────────────────────────
  {
    path: "azure.storageConnectionString",
    env: "AZURE_STORAGE_CONNECTION_STRING",
    section: "azure",
    tier: "secret",
    type: "string",
    label: "Azure storage connection string",
    description: "Used to download the shared index (Azure Portal \u2192 Storage Account \u2192 Access keys). Stored in config/secrets.json."
  },
  {
    path: "server.apiKey",
    env: "API_KEY",
    section: "server",
    tier: "secret",
    type: "string",
    label: "API key required from HTTP clients",
    description: "Every HTTP request must present this key as X-Api-Key (or Authorization: Bearer). Required for any server reachable from the network \u2014 without it the listener serves your indexed X++ source to anyone who can reach the port, so with no key set the server binds 127.0.0.1 instead, and refuses to start if HOST asks for a public interface anyway. May be left empty only for a localhost-only development server. Generate with `openssl rand -hex 32`."
  },
  {
    path: "behavior.groundingSecret",
    env: "GROUNDING_SECRET",
    section: "behavior",
    tier: "secret",
    type: "string",
    label: "Shared secret for portable grounding tokens",
    description: "Set the SAME random string on both halves of a hybrid deployment (and on every scaled-out App Service instance) so tokens issued by one process validate in another. Without it, tokens are memory-local."
  }
];
var BY_PATH = new Map(SETTINGS.flatMap((s) => s.path ? [[s.path, s]] : []));
var BY_ENV = new Map(SETTINGS.map((s) => [s.env, s]));
function serializeValue(setting, value) {
  if (value === void 0 || value === null) return null;
  switch (setting.type) {
    case "boolean":
      return value ? "true" : "false";
    case "int":
      return String(value);
    case "list":
      return Array.isArray(value) ? value.join(",") : String(value);
    default: {
      const s = String(value);
      return s.length > 0 ? s : null;
    }
  }
}

// src/config/configFile.ts
function getAtPath(obj, path5) {
  if (!obj || !path5) return void 0;
  return path5.split(".").reduce((acc, key) => acc == null ? void 0 : acc[key], obj);
}
function configCandidates(baseDir) {
  return [join(baseDir, "d365fo-mcp.json"), join(baseDir, "config", "d365fo-mcp.json")];
}
function readJson(file) {
  try {
    if (!fs.existsSync(file)) return null;
    const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
    return typeof parsed === "object" && parsed !== null ? parsed : null;
  } catch (err) {
    process.stderr.write(`[config] Cannot parse ${file}: ${err instanceof Error ? err.message : String(err)}
`);
    return null;
  }
}
function resolveConfigFiles(baseDir, opts) {
  const explicit = opts?.allowEnvOverride === false ? void 0 : process.env.D365FO_CONFIG?.trim();
  const configPath = explicit ? resolve(explicit) : configCandidates(baseDir).find((p) => fs.existsSync(p)) ?? opts?.fallbackConfigPath ?? join(baseDir, "config", "d365fo-mcp.json");
  const dir = dirname(configPath);
  return {
    dir,
    baseDir: configBaseDir(configPath),
    configPath,
    secretsPath: join(dir, "secrets.json"),
    config: readJson(configPath),
    secrets: readJson(join(dir, "secrets.json"))
  };
}
function configBaseDir(configPath) {
  const dir = dirname(configPath);
  return basename(dir).toLowerCase() === "config" ? dirname(dir) : dir;
}
function toEnvRecord(files) {
  const out = {};
  for (const setting of SETTINGS) {
    const source = setting.tier === "secret" ? files.secrets : files.config;
    const raw = getAtPath(source, setting.path);
    const value = serializeValue(setting, raw);
    if (value === null) continue;
    out[setting.env] = setting.type === "path" && !isAbsolute(value) ? resolve(files.baseDir, value) : value;
  }
  return out;
}
function defaultPathEnv(baseDir) {
  const out = {};
  for (const setting of SETTINGS) {
    if (!setting.path || setting.type !== "path" || typeof setting.default !== "string" || setting.default === "") continue;
    out[setting.env] = isAbsolute(setting.default) ? setting.default : resolve(baseDir, setting.default);
  }
  return out;
}

// src/utils/loadEnv.ts
var PATH_VARS = ["DB_PATH", "LABELS_DB_PATH", "METADATA_PATH"];
var WRITE_POLICY_VARS = [
  "D365FO_ALLOW_CROSS_MODEL_WRITE",
  "D365FO_CROSS_MODEL_WRITE_MODELS"
];
var writePolicySource = null;
var writePolicyStamp = "";
function installRootFrom(callerDir) {
  let dir = resolve2(callerDir, "..");
  for (let up = 0; up < 3; up++) {
    const hasConfig = existsSync2(join2(dir, "config", "d365fo-mcp.json")) || existsSync2(join2(dir, "d365fo-mcp.json")) || existsSync2(join2(dir, ".env"));
    if (hasConfig) return dir;
    const parent = dirname2(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolve2(callerDir, "..");
}
function loadEnv(callerImportMetaUrl) {
  const callerDir = dirname2(fileURLToPath(callerImportMetaUrl));
  const envPath = process.env.ENV_FILE ? resolve2(process.env.ENV_FILE) : resolve2(installRootFrom(callerDir), ".env");
  const fromRealEnv = new Set(Object.keys(process.env));
  writePolicySource = {
    envPath,
    pinned: new Set(WRITE_POLICY_VARS.filter((k) => fromRealEnv.has(k)))
  };
  try {
    writePolicyStamp = String(statSync(envPath).mtimeMs);
  } catch {
    writePolicyStamp = "-";
  }
  const result = dotenv.config({ path: envPath, quiet: true });
  if (result.error && !process.env.ENV_FILE) {
    dotenv.config({ quiet: true });
  }
  const envDir = dirname2(envPath);
  for (const key of PATH_VARS) {
    const val = process.env[key];
    if (val && !isAbsolute2(val)) {
      process.env[key] = resolve2(envDir, val);
    }
  }
  const pinnedByEnvFile = process.env.ENV_FILE && !process.env.D365FO_CONFIG ? new Set(Object.keys(result.parsed ?? {})) : /* @__PURE__ */ new Set();
  const files = resolveConfigFiles(envDir);
  for (const [key, value] of Object.entries(toEnvRecord(files))) {
    if (!fromRealEnv.has(key) && !pinnedByEnvFile.has(key)) process.env[key] = value;
  }
  for (const [key, value] of Object.entries(defaultPathEnv(files.baseDir))) {
    if (!process.env[key]) process.env[key] = value;
  }
  if (process.env.D365FO_DEV_ENVIRONMENT_TYPE) {
    process.env.DEV_ENVIRONMENT_TYPE = process.env.D365FO_DEV_ENVIRONMENT_TYPE;
  }
}

// src/bootstrapEnv.ts
loadEnv(import.meta.url);

// scripts/extract-metadata.ts
import * as fs7 from "fs/promises";
import * as path4 from "path";
import * as os from "os";
import { fileURLToPath as fileURLToPath2 } from "url";

// src/metadata/xmlParser.ts
import * as fs2 from "fs/promises";

// src/utils/xml.ts
import { Builder, Parser, parseStringPromise } from "xml2js";

// src/metadata/enhancedParser.ts
var EnhancedXppParser = class {
  constructor() {
  }
  /**
   * Extract semantic tags from method name and source code
   */
  extractSemanticTags(source, className, methodName) {
    const tags = /* @__PURE__ */ new Set();
    const namePatterns = {
      "validation": /validate|check|verify|isValid|canSubmit/i,
      "initialization": /init|create|new|construct|setup|build/i,
      "data-modification": /update|modify|change|set|edit|save|write/i,
      "query": /find|select|query|search|get|fetch|load|read/i,
      "deletion": /delete|remove|clear|purge|drop/i,
      "calculation": /calculate|compute|sum|total|aggregate/i,
      "conversion": /convert|transform|parse|format|serialize/i,
      "event-handler": /on[A-Z]|handle|process[A-Z]/i
    };
    for (const [tag, pattern] of Object.entries(namePatterns)) {
      if (pattern.test(methodName)) {
        tags.add(tag);
      }
    }
    const contentPatterns = {
      "transaction": /\b(ttsbegin|ttscommit|ttsabort)\b/i,
      "error-handling": /\b(throw|error\(|warning\(|try|catch)\b/i,
      "database-query": /\bselect\b.*\bwhere\b/is,
      "set-based": /\b(insert_recordset|update_recordset|delete_from)\b/i,
      "loop": /\b(while|for|do)\s*\(/i,
      "conditional": /\bif\s*\(/i,
      "async": /\basync\b/i,
      "static-method": /\bstatic\b/i
    };
    for (const [tag, pattern] of Object.entries(contentPatterns)) {
      if (pattern.test(source)) {
        tags.add(tag);
      }
    }
    const classPatterns = {
      "customer": /^Cust/,
      "vendor": /^Vend/,
      "inventory": /^Invent/,
      "sales": /^Sales/,
      "purchasing": /^Purch/,
      "ledger": /^Ledger/,
      "tax": /^Tax/,
      "project": /^Proj/,
      "warehouse": /^(WMS|WHs)/,
      "production": /^Prod/
    };
    for (const [tag, pattern] of Object.entries(classPatterns)) {
      if (pattern.test(className)) {
        tags.add(tag);
      }
    }
    return Array.from(tags);
  }
  /**
   * Calculate complexity score for a method
   */
  calculateComplexity(source) {
    const lines = source.split("\n").filter((line) => line.trim().length > 0).length;
    const ifCount = (source.match(/\bif\s*\(/gi) || []).length;
    const loopCount = (source.match(/\b(for|while|do)\s*\(/gi) || []).length;
    const switchCount = (source.match(/\bswitch\s*\(/gi) || []).length;
    const caseCount = (source.match(/\bcase\b/gi) || []).length;
    const catchCount = (source.match(/\bcatch\b/gi) || []).length;
    return lines + ifCount * 2 + loopCount * 3 + switchCount * 2 + caseCount + catchCount * 2;
  }
  /**
   * Extract types (classes/tables) used in the source code
   */
  extractUsedTypes(source) {
    const types = /* @__PURE__ */ new Set();
    const patterns = [
      /\b([A-Z][a-zA-Z0-9_]*)\s+[a-z]/g,
      /\b([A-Z][a-zA-Z0-9_]*)::/g,
      /new\s+([A-Z][a-zA-Z0-9_]*)\s*\(/g
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(source)) !== null) {
        const typeName = match[1];
        if (!["Int", "String", "Real", "Boolean", "Date", "DateTime", "Guid", "Int64"].includes(typeName)) {
          types.add(typeName);
        }
      }
    }
    return Array.from(types);
  }
  /**
   * Extract method calls from source code
   */
  extractMethodCalls(source) {
    const methods = /* @__PURE__ */ new Set();
    const patterns = [
      /\.([a-z][a-zA-Z0-9_]*)\s*\(/g,
      /::([a-z][a-zA-Z0-9_]*)\s*\(/g
    ];
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(source)) !== null) {
        methods.add(match[1]);
      }
    }
    return Array.from(methods);
  }
  /**
   * Extract inline comments from source code
   */
  extractInlineComments(source) {
    const commentLines = [];
    const lines = source.split("\n");
    for (const line of lines) {
      const commentMatch = line.match(/\/\/\s*(.+)/);
      if (commentMatch) {
        commentLines.push(commentMatch[1].trim());
      }
      const blockMatch = line.match(/\/\*\s*(.+?)\s*\*\//);
      if (blockMatch) {
        commentLines.push(blockMatch[1].trim());
      }
    }
    return commentLines.join(" ");
  }
  /**
   * Get first N lines of code
   */
  getFirstLines(source, lineCount = 10) {
    const lines = source.split("\n").slice(0, lineCount);
    let result = lines.join("\n");
    if (source.split("\n").length > lineCount) {
      result += "\n// ...";
    }
    return result;
  }
  /**
   * Parse method with enhanced metadata
   */
  parseMethodEnhanced(method, parentClass) {
    const source = method.source || "";
    const methodName = method.name || "unknown";
    const enhanced = {
      ...method,
      sourceSnippet: this.getFirstLines(source, 10),
      complexity: this.calculateComplexity(source),
      usedTypes: this.extractUsedTypes(source),
      methodCalls: this.extractMethodCalls(source),
      tags: this.extractSemanticTags(source, parentClass, methodName),
      inlineComments: this.extractInlineComments(source)
    };
    return enhanced;
  }
  /**
   * Create usage pattern examples from method source
   */
  generateUsageExample(className, method) {
    const isStatic = method.isStatic;
    const params = method.parameters.map((p) => {
      if (p.type.toLowerCase().includes("int")) return "0";
      if (p.type.toLowerCase().includes("str")) return '""';
      if (p.type.toLowerCase().includes("bool")) return "false";
      if (p.type.toLowerCase().includes("date")) return "DateTimeUtil::getToday(DateTimeUtil::getUserPreferredTimeZone())";
      return `${p.name}Value`;
    }).join(", ");
    if (isStatic) {
      return `${className}::${method.name}(${params});`;
    } else {
      return `${className} obj = new ${className}();
obj.${method.name}(${params});`;
    }
  }
  /**
   * Extract all classes/tables used by a class
   */
  extractClassDependencies(classInfo) {
    const dependencies = /* @__PURE__ */ new Set();
    if (classInfo.extends) {
      dependencies.add(classInfo.extends);
    }
    classInfo.implements?.forEach((i) => dependencies.add(i));
    for (const method of classInfo.methods) {
      const types = this.extractUsedTypes(method.source);
      types.forEach((t) => dependencies.add(t));
    }
    return Array.from(dependencies);
  }
  /**
   * Generate comprehensive tags for a class
   */
  generateClassTags(classInfo) {
    const tags = /* @__PURE__ */ new Set();
    if (/Controller|Engine|Service|Manager/i.test(classInfo.name)) {
      tags.add("business-logic");
    }
    if (/Helper|Util|Tool/i.test(classInfo.name)) {
      tags.add("utility");
    }
    if (/Builder/i.test(classInfo.name)) {
      tags.add("builder-pattern");
    }
    if (/Factory/i.test(classInfo.name)) {
      tags.add("factory-pattern");
    }
    if (/Handler/i.test(classInfo.name)) {
      tags.add("event-handler");
    }
    if (classInfo.isAbstract) {
      tags.add("abstract");
    }
    if (classInfo.isFinal) {
      tags.add("final");
    }
    const hasMainMethod = classInfo.methods.some((m) => m.name === "main" && m.isStatic);
    if (hasMainMethod) {
      tags.add("runnable");
    }
    return Array.from(tags);
  }
  /**
   * Detect pattern type for a class
   */
  detectClassPatternType(className, methods) {
    if (className.endsWith("Helper")) return "Helper";
    if (className.endsWith("Service")) return "Service";
    if (className.endsWith("Controller")) return "Controller";
    if (className.endsWith("Handler")) return "Handler";
    if (className.endsWith("Repository") || className.endsWith("Repo")) return "Repository";
    if (className.endsWith("Manager")) return "Manager";
    if (className.endsWith("Factory")) return "Factory";
    if (className.endsWith("Builder")) return "Builder";
    if (className.endsWith("Processor")) return "Processor";
    if (className.endsWith("Validator")) return "Validator";
    if (className.endsWith("Provider")) return "Provider";
    if (className.endsWith("Adapter")) return "Adapter";
    const methodNames = methods.map((m) => m.name.toLowerCase());
    const repoMethods = ["find", "get", "save", "update", "delete", "insert"];
    if (methodNames.filter((n) => repoMethods.some((rm2) => n.includes(rm2))).length >= 3) {
      return "Repository";
    }
    const serviceMethods = ["process", "execute", "handle", "run", "perform"];
    if (methodNames.filter((n) => serviceMethods.some((sm) => n.includes(sm))).length >= 2) {
      return "Service";
    }
    const validatorMethods = ["validate", "check", "verify", "isvalid"];
    if (methodNames.filter((n) => validatorMethods.some((vm) => n.includes(vm))).length >= 2) {
      return "Validator";
    }
    return "Unknown";
  }
  /**
   * Generate typical usage patterns from method source
   */
  generateTypicalUsages(className, methods) {
    const usages = [];
    const staticMethods = methods.filter((m) => m.isStatic);
    for (const method of staticMethods.slice(0, 3)) {
      const params = method.parameters.map((p) => this.generateExampleValue(p.type)).join(", ");
      usages.push(`${className}::${method.name}(${params});`);
    }
    const mainMethod = methods.find((m) => m.name === "main" && m.isStatic);
    if (mainMethod) {
      usages.push(`${className}::main(args);`);
    }
    const publicMethods = methods.filter((m) => !m.isStatic && m.visibility === "public");
    if (publicMethods.length > 0) {
      const method = publicMethods[0];
      const params = method.parameters.map((p) => this.generateExampleValue(p.type)).join(", ");
      usages.push(`${className} instance = new ${className}();
instance.${method.name}(${params});`);
    }
    return usages;
  }
  /**
   * Generate example value based on type
   */
  generateExampleValue(typeName) {
    const lower = typeName.toLowerCase();
    if (lower.includes("int") || lower.includes("recid")) return "0";
    if (lower.includes("str") || lower.includes("string")) return '""';
    if (lower.includes("bool")) return "false";
    if (lower.includes("date")) return "DateTimeUtil::getToday(DateTimeUtil::getUserPreferredTimeZone())";
    if (lower.includes("datetime")) return "DateTimeUtil::utcNow()";
    if (lower.includes("real")) return "0.0";
    if (lower.includes("guid")) return "newGuid()";
    return `${typeName.toLowerCase()}Value`;
  }
  /**
   * Analyze method relationships and generate related methods list
   */
  generateRelatedMethods(method, allMethods) {
    const related = /* @__PURE__ */ new Set();
    const baseMethodName = method.name.replace(/(get|set|is|has|can|validate|check)/, "");
    for (const other of allMethods) {
      if (other.name !== method.name && other.name.includes(baseMethodName)) {
        related.add(other.name);
      }
    }
    if (method.methodCalls) {
      for (const call of method.methodCalls) {
        const found = allMethods.find((m) => m.name === call);
        if (found) {
          related.add(call);
        }
      }
    }
    if (method.tags) {
      for (const other of allMethods) {
        if (other.name !== method.name && other.tags) {
          const commonTags = method.tags.filter((t) => other.tags?.includes(t));
          if (commonTags.length >= 2) {
            related.add(other.name);
          }
        }
      }
    }
    return Array.from(related).slice(0, 10);
  }
  /**
   * Build API patterns from method source code
   */
  buildApiPatterns(_className, method) {
    const patterns = {
      initialization: [],
      commonSequences: [],
      errorHandling: []
    };
    const source = method.source;
    if (source.includes("new ")) {
      const initMatch = source.match(/new\s+\w+\s*\([^)]*\)/g);
      if (initMatch) {
        patterns.initialization = initMatch.slice(0, 3);
      }
    }
    const lines = source.split("\n");
    const sequences = [];
    for (let i = 0; i < lines.length - 1; i++) {
      const line1 = lines[i].trim();
      const line2 = lines[i + 1].trim();
      if (line1.includes(".") && line2.includes(".")) {
        sequences.push(`${line1}
${line2}`);
      }
    }
    patterns.commonSequences = sequences.slice(0, 3);
    if (source.includes("try") || source.includes("catch")) {
      const tryMatch = source.match(/try\s*{[^}]+}\s*catch[^{]*{[^}]+}/s);
      if (tryMatch) {
        patterns.errorHandling.push(tryMatch[0].slice(0, 200));
      }
    }
    return patterns;
  }
};

// src/metadata/formPatternMiner.ts
var PROPERTY_KEYS = [
  "Caption",
  "Visible",
  "Enabled",
  "AutoDeclaration",
  "DataSource",
  "DataField",
  "DataMethod",
  // A container carrying DataGroup is populated by the compiler from that table
  // field group — one generated control per member, named <DataGroup>_<Field>.
  "DataGroup",
  "HelpText",
  "Label",
  "Width",
  "Height",
  "AllowEdit",
  "Mandatory",
  "Style",
  "TitleDataSource",
  "ArrangeMethod",
  "MultiSelect",
  "ShowRowLabels",
  "WidthMode",
  "HeightMode"
];
function asString(value) {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value && typeof value === "object" && typeof value._ === "string") {
    const text = value._;
    return text.length > 0 ? text : void 0;
  }
  return void 0;
}
function asArray(value) {
  if (value === void 0 || value === null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value === "") return [];
  return [value];
}
var EXTENSION_CONTROL_NAMES = /* @__PURE__ */ new Set(["QuickFilterControl", "SegmentedEntryControl"]);
function normalizeControlType(axType) {
  if (!axType) return "";
  let t = axType;
  if (t.startsWith("AxForm")) t = t.slice("AxForm".length);
  if (t.endsWith("Control") && !EXTENSION_CONTROL_NAMES.has(t)) t = t.slice(0, -"Control".length);
  return t;
}
function resolveControlType(node) {
  const axType = asString(node["i:type"]);
  const fromAxType = normalizeControlType(axType);
  if (fromAxType) return { type: fromAxType, axType };
  const typeElement = asString(node.Type);
  if (typeElement) return { type: typeElement, axType };
  const extension = node.FormControlExtension;
  if (extension && typeof extension === "object" && extension["i:nil"] !== "true") {
    const extName = asString(extension.Name);
    if (extName) return { type: extName, axType };
  }
  return { type: "Control", axType };
}
function extractControlNode(node) {
  if (!node || typeof node !== "object") return null;
  const { type, axType } = resolveControlType(node);
  const control = {
    name: asString(node.Name) ?? "Unknown",
    type,
    properties: {},
    children: []
  };
  if (axType) control.axType = axType;
  const pattern = asString(node.Pattern);
  if (pattern) control.pattern = pattern;
  const patternVersion = asString(node.PatternVersion);
  if (patternVersion) control.patternVersion = patternVersion;
  for (const prop of PROPERTY_KEYS) {
    const value = asString(node[prop]);
    if (value !== void 0) control.properties[prop] = value;
  }
  const controlsNode = node.Controls;
  if (controlsNode && typeof controlsNode === "object") {
    for (const childNode of asArray(controlsNode.AxFormControl)) {
      const child = extractControlNode(childNode);
      if (child) control.children.push(child);
    }
  }
  return control;
}
function walkFormDesign(designNode) {
  const design = { properties: {}, controls: [] };
  if (!designNode || typeof designNode !== "object") return design;
  design.pattern = asString(designNode.Pattern);
  design.patternVersion = asString(designNode.PatternVersion);
  design.style = asString(designNode.Style);
  for (const prop of PROPERTY_KEYS) {
    const value = asString(designNode[prop]);
    if (value !== void 0) design.properties[prop] = value;
  }
  const controlsNode = designNode.Controls;
  if (controlsNode && typeof controlsNode === "object") {
    for (const node of asArray(controlsNode.AxFormControl)) {
      const control = extractControlNode(node);
      if (control) design.controls.push(control);
    }
  } else {
    for (const key of Object.keys(designNode).filter((k) => k.startsWith("AxForm"))) {
      for (const node of asArray(designNode[key])) {
        const control = extractControlNode(node);
        if (control) {
          if (!control.axType) control.axType = key;
          if (control.type === "Control") control.type = normalizeControlType(key) || control.type;
          design.controls.push(control);
        }
      }
    }
  }
  return design;
}
function collectPatternNodes(design) {
  const records = [];
  if (design.pattern) {
    records.push({
      nodePath: "Design",
      controlName: "",
      controlType: "",
      pattern: design.pattern,
      patternVersion: design.patternVersion,
      childSequence: design.controls.map((c2) => c2.type)
    });
  }
  const visit = (node, parentPath) => {
    const nodePath = `${parentPath}/${node.type}[${node.name}]`;
    if (node.pattern) {
      records.push({
        nodePath,
        controlName: node.name,
        controlType: node.type,
        pattern: node.pattern,
        patternVersion: node.patternVersion,
        childSequence: node.children.map((c2) => c2.type)
      });
    }
    for (const child of node.children) visit(child, nodePath);
  };
  for (const control of design.controls) visit(control, "Design");
  return records;
}

// src/metadata/xppDeclaration.ts
var MODIFIER_KEYWORDS = [
  "public",
  "private",
  "protected",
  "internal",
  "static",
  "final",
  "abstract",
  "display",
  "edit"
];
var STATEMENT_KEYWORDS = [
  "return",
  "if",
  "while",
  "for",
  "switch",
  "throw",
  "else",
  "do",
  "new"
];
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function blankCommentsAndStrings(src) {
  const out = src.split("");
  let state = "code";
  let quote = "";
  for (let i = 0; i < src.length; i++) {
    const c2 = src[i];
    const d = src[i + 1];
    if (state === "code") {
      if (c2 === "/" && d === "/") {
        state = "line";
        out[i] = out[i + 1] = " ";
        i++;
      } else if (c2 === "/" && d === "*") {
        state = "block";
        out[i] = out[i + 1] = " ";
        i++;
      } else if (c2 === "'" || c2 === '"') {
        state = "str";
        quote = c2;
      }
    } else if (state === "line") {
      if (c2 === "\n") state = "code";
      else out[i] = " ";
    } else if (state === "block") {
      if (c2 === "*" && d === "/") {
        state = "code";
        out[i] = out[i + 1] = " ";
        i++;
      } else if (c2 !== "\n") out[i] = " ";
    } else {
      if (c2 === "\\") {
        out[i] = " ";
        if (d !== void 0 && d !== "\n") {
          out[i + 1] = " ";
          i++;
        }
      } else if (c2 === quote) state = "code";
      else if (c2 !== "\n") out[i] = " ";
    }
  }
  return out.join("");
}
function splitTopLevelParams(paramSrc, blanked) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < blanked.length; i++) {
    const c2 = blanked[i];
    if (c2 === "(" || c2 === "[") depth++;
    else if (c2 === ")" || c2 === "]") depth--;
    else if (c2 === "," && depth === 0) {
      parts.push(paramSrc.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(paramSrc.slice(start));
  return parts;
}
function isTypeToken(t) {
  return /^[A-Za-z_][\w.]*$/.test(t) || /^\d+$/.test(t);
}
function isNameToken(t) {
  return /^[A-Za-z_]\w*$/.test(t);
}
function sliceByBlankedExtent(raw, blanked, from) {
  let start = from;
  while (start < blanked.length && /\s/.test(blanked[start])) start++;
  let end = blanked.length;
  while (end > start && /\s/.test(blanked[end - 1])) end--;
  return raw.slice(start, end).replace(/\s+/g, " ");
}
function parseParameter(raw, blanked) {
  let eq = -1;
  let depth = 0;
  for (let i = 0; i < blanked.length; i++) {
    const c2 = blanked[i];
    if (c2 === "(" || c2 === "[") depth++;
    else if (c2 === ")" || c2 === "]") depth--;
    else if (c2 === "=" && depth === 0) {
      eq = i;
      break;
    }
  }
  const left = (eq >= 0 ? blanked.slice(0, eq) : blanked).trim().replace(/\s+/g, " ");
  const defaultValue = eq >= 0 ? sliceByBlankedExtent(raw, blanked, eq + 1) : void 0;
  const tokens = left.split(" ").filter(Boolean);
  if (tokens.length < 2) return null;
  const name = tokens[tokens.length - 1];
  const typeTokens = tokens.slice(0, -1);
  if (!isNameToken(name) || !typeTokens.every(isTypeToken)) return null;
  if (eq >= 0 && !defaultValue) return null;
  const type = typeTokens.join(" ");
  return defaultValue ? { type, name, defaultValue } : { type, name };
}
function tryDeclarationAt(source, blanked, nameStart, name) {
  const openParen = blanked.indexOf("(", nameStart);
  if (openParen < 0) return null;
  let depth = 0;
  let closeParen = -1;
  for (let i = openParen; i < blanked.length; i++) {
    const c2 = blanked[i];
    if (c2 === "(") depth++;
    else if (c2 === ")") {
      depth--;
      if (depth === 0) {
        closeParen = i;
        break;
      }
    }
  }
  if (closeParen < 0) return null;
  const after = /^\s*(\S)/.exec(blanked.slice(closeParen + 1));
  if (after && after[1] !== "{" && after[1] !== ";") return null;
  const lineStart = blanked.lastIndexOf("\n", nameStart) + 1;
  const prefix = blanked.slice(lineStart, nameStart);
  if (prefix.includes("=")) return null;
  const modifiers = MODIFIER_KEYWORDS.filter((k) => new RegExp(`\\b${k}\\b`, "i").test(prefix));
  const prefixTokens = prefix.match(/[\w.]+/g) ?? [];
  const typeTokens = prefixTokens.filter((t) => !MODIFIER_KEYWORDS.includes(t.toLowerCase()));
  const returnType = typeTokens[typeTokens.length - 1];
  if (!returnType || STATEMENT_KEYWORDS.includes(returnType.toLowerCase())) return null;
  const paramSrc = source.slice(openParen + 1, closeParen);
  const paramBlanked = blanked.slice(openParen + 1, closeParen);
  const parameters = [];
  if (paramBlanked.trim()) {
    const rawParts = splitTopLevelParams(paramSrc, paramBlanked);
    const blankedParts = splitTopLevelParams(paramBlanked, paramBlanked);
    for (let i = 0; i < rawParts.length; i++) {
      const param = parseParameter(rawParts[i], blankedParts[i]);
      if (!param) return null;
      parameters.push(param);
    }
  }
  return { name, modifiers, returnType, parameters };
}
function parseXppClassHeader(declaration) {
  if (!declaration || typeof declaration !== "string") return null;
  const blanked = blankCommentsAndStrings(declaration);
  const kw = /\b(class|interface)\s+([\w.]+)/.exec(blanked);
  if (!kw) return null;
  const braceIdx = blanked.indexOf("{", kw.index);
  const headEnd = braceIdx < 0 ? blanked.length : braceIdx;
  const head = blanked.slice(kw.index, headEnd);
  const lineStart = blanked.lastIndexOf("\n", kw.index) + 1;
  const modifiers = blanked.slice(lineStart, kw.index);
  const extendsMatch = /\bextends\s+([\w.]+)/i.exec(head);
  const implementsMatch = /\bimplements\s+([\s\S]+)$/i.exec(head);
  const implementsList = implementsMatch ? implementsMatch[1].split(",").map((s) => s.trim()).filter(Boolean) : [];
  const visibilityMatch = /\b(public|private|protected|internal)\b/i.exec(modifiers);
  return {
    kind: kw[1],
    name: kw[2],
    extends: extendsMatch?.[1],
    implements: implementsList,
    isAbstract: /\babstract\b/i.test(modifiers),
    isFinal: /\bfinal\b/i.test(modifiers),
    visibility: visibilityMatch ? visibilityMatch[1].toLowerCase() : void 0
  };
}
function visibilityFromModifiers(modifiers) {
  return modifiers.find(
    (m) => m === "public" || m === "private" || m === "protected" || m === "internal"
  );
}
function parseExtensionOfAttribute(declaration) {
  if (!declaration || typeof declaration !== "string") return null;
  const blanked = blankCommentsAndStrings(declaration);
  const m = /ExtensionOf\s*\(\s*(\w+)Str\s*\(\s*([\w.]+)\s*(?:,\s*([\w.]+)\s*)?\)/i.exec(blanked);
  if (!m) return null;
  return {
    baseObjectName: m[2],
    baseKind: m[1].toLowerCase(),
    memberName: m[3]
  };
}
function callsNext(source) {
  if (!source || typeof source !== "string") return false;
  return /\bnext\s+\w+\s*\(/i.test(blankCommentsAndStrings(source));
}
function parseXppDeclaration(source, methodName) {
  if (!source || !methodName) return null;
  const blanked = blankCommentsAndStrings(source);
  const nameRe = new RegExp(`(^|[^\\w.:])(${escapeRegExp(methodName)})\\s*\\(`, "gi");
  for (const m of blanked.matchAll(nameRe)) {
    const decl = tryDeclarationAt(source, blanked, m.index + m[1].length, m[2]);
    if (decl) return decl;
  }
  return null;
}

// src/metadata/xmlParser.ts
function extensionMembersFrom(methods) {
  const addedMethods = [];
  const cocMethods = [];
  const eventSubscriptions = [];
  for (const { name, source } of methods) {
    if (!name) continue;
    addedMethods.push(name);
    if (callsNext(source || "")) cocMethods.push(name);
    if (/\[SubscribesTo\s*\(/i.test(source || "")) {
      eventSubscriptions.push(source.match(/\[SubscribesTo\s*\([^)]+\)/)?.[0] || name);
    }
  }
  return { addedMethods, cocMethods, eventSubscriptions };
}
function buildClassExtensionRecord(classInfo, model) {
  if (!classInfo.extensionOf) return null;
  const { baseObjectName, baseKind, memberName } = classInfo.extensionOf;
  return {
    name: classInfo.name,
    baseObjectName,
    baseKind,
    ...memberName ? { baseMemberName: memberName } : {},
    sourcePath: classInfo.sourcePath,
    addedFields: [],
    addedIndexes: [],
    ...extensionMembersFrom(classInfo.methods),
    model,
    type: "class-extension"
  };
}
var XppMetadataParser = class {
  enhancedParser;
  get parser() {
    return new Parser({
      explicitArray: false,
      mergeAttrs: true,
      trim: true
    });
  }
  constructor() {
    this.enhancedParser = new EnhancedXppParser();
  }
  /**
   * Parse an X++ class file (AxClass XML)
   */
  async parseClassFile(filePath, model) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      if (!parsed.AxClass) {
        return { success: false, error: "Not a valid AxClass file" };
      }
      const axClass = parsed.AxClass;
      const className = axClass.Name || "UnknownClass";
      const methodsData = axClass.SourceCode?.Methods?.Method || axClass.Methods?.Method;
      const parsedMethods = this.parseMethods(methodsData, className);
      const declarationCdata = this.cdataText(axClass.SourceCode?.Declaration);
      const header = parseXppClassHeader(declarationCdata);
      const extensionOf = parseExtensionOfAttribute(declarationCdata) ?? void 0;
      const parsedImplements = header?.implements.length ? header.implements : this.parseImplements(axClass.Implements);
      const parsedDeclaration = this.extractClassDeclaration(axClass, header);
      const isAbstract = header?.isAbstract ?? (axClass.IsAbstract === "Yes" || axClass.IsAbstract === "true");
      const isFinal = header?.isFinal ?? (axClass.IsFinal === "Yes" || axClass.IsFinal === "true");
      const extendsClass = header?.extends || axClass.Extends || void 0;
      const classInfoBase = {
        name: className,
        model: model || "Unknown",
        sourcePath: filePath,
        extends: extendsClass,
        implements: parsedImplements,
        isAbstract,
        isFinal,
        visibility: header?.visibility,
        declaration: parsedDeclaration,
        extensionOf,
        methods: parsedMethods,
        documentation: axClass.DeveloperDocumentation || void 0
      };
      const classInfo = {
        ...classInfoBase,
        tags: this.enhancedParser.generateClassTags({ ...classInfoBase, methods: [] }),
        usedTypes: this.enhancedParser.extractClassDependencies(classInfoBase),
        description: axClass.DeveloperDocumentation || `${className} class${extendsClass ? ` extending ${extendsClass}` : ""}`
      };
      return { success: true, data: classInfo };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Parse an X++ table file (AxTable XML)
   */
  async parseTableFile(filePath, model) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      if (!parsed.AxTable) {
        return { success: false, error: "Not a valid AxTable file" };
      }
      const axTable = parsed.AxTable;
      const tableName = axTable.Name || "UnknownTable";
      const tableInfo = {
        name: tableName,
        model: model || "Unknown",
        sourcePath: filePath,
        label: axTable.Label || tableName,
        tableGroup: axTable.TableGroup || "Main",
        primaryIndex: axTable.PrimaryIndex || void 0,
        clusteredIndex: axTable.ClusteredIndex || void 0,
        fields: this.parseFields(axTable.Fields?.AxTableField),
        indexes: this.parseIndexes(axTable.Indexes?.AxTableIndex),
        relations: this.parseRelations(axTable.Relations?.AxTableRelation),
        methods: this.parseMethods(axTable.SourceCode?.Methods?.Method, tableName)
      };
      return { success: true, data: tableInfo };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Parse an X++ view/data entity file (AxView or AxDataEntityView XML)
   */
  async parseViewFile(filePath, model) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      const axView = parsed.AxDataEntityView || parsed.AxView;
      if (!axView) {
        return { success: false, error: "Not a valid AxView/AxDataEntityView file" };
      }
      const isDataEntity = !!parsed.AxDataEntityView;
      const viewName = axView.Name || "UnknownView";
      const viewInfo = {
        name: viewName,
        model: model || "Unknown",
        sourcePath: filePath,
        type: isDataEntity ? "data-entity" : "view",
        label: axView.Label || void 0,
        isPublic: axView.IsPublic === "Yes" || axView.IsPublic === "true",
        isReadOnly: axView.IsReadOnly === "Yes" || axView.IsReadOnly === "true",
        primaryKey: axView.PrimaryKey || void 0,
        primaryKeyFields: this.parseViewPrimaryKeyFields(axView.Keys, axView.PrimaryKey),
        fields: this.parseViewFields(axView.Fields),
        relations: this.parseViewRelations(axView.Relations),
        methods: this.parseMethods(axView.SourceCode?.Methods?.Method, viewName)
      };
      return { success: true, data: viewInfo };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Text of a CDATA-bearing element. xml2js hands back a plain string, unless
   * the element carries an attribute (mergeAttrs) — then the text sits under
   * `_` and the raw value is an object.
   */
  cdataText(node) {
    if (typeof node === "string") return node;
    const text = node?._;
    return typeof text === "string" ? text : "";
  }
  parseImplements(implementsStr) {
    if (!implementsStr) return [];
    if (typeof implementsStr !== "string") return [];
    return implementsStr.split(",").map((i) => i.trim()).filter(Boolean);
  }
  /**
   * The class's declaration line. Rebuilt from the parsed Declaration CDATA so
   * it reflects what the source actually says; falls back to synthesising one
   * from XML elements when there is no declaration to read.
   */
  extractClassDeclaration(axClass, header) {
    const modifiers = [];
    if (header) {
      if (header.visibility) modifiers.push(header.visibility);
      if (header.isAbstract) modifiers.push("abstract");
      if (header.isFinal) modifiers.push("final");
      let decl2 = modifiers.length > 0 ? `${modifiers.join(" ")} ` : "";
      decl2 += `${header.kind} ${header.name}`;
      if (header.extends) decl2 += ` extends ${header.extends}`;
      if (header.implements.length) decl2 += ` implements ${header.implements.join(", ")}`;
      return decl2;
    }
    if (axClass.IsAbstract === "Yes" || axClass.IsAbstract === "true") modifiers.push("abstract");
    if (axClass.IsFinal === "Yes" || axClass.IsFinal === "true") modifiers.push("final");
    let decl = modifiers.length > 0 ? `${modifiers.join(" ")} ` : "";
    decl += `class ${axClass.Name}`;
    if (axClass.Extends) decl += ` extends ${axClass.Extends}`;
    if (axClass.Implements) decl += ` implements ${axClass.Implements}`;
    return decl;
  }
  parseMethods(methodsData, parentClass = "Unknown") {
    if (!methodsData) return [];
    const methods = Array.isArray(methodsData) ? methodsData : [methodsData];
    return methods.map((method) => {
      const source = method.Source || "";
      const methodName = method.Name || "unknown";
      const decl = parseXppDeclaration(source, methodName);
      const baseMethod = {
        name: methodName,
        visibility: this.parseVisibility(decl?.modifiers, method.Visibility),
        returnType: decl?.returnType || method.ReturnType || "void",
        parameters: this.toParameterInfo(decl),
        parametersUnknown: decl === null,
        isStatic: decl?.modifiers.includes("static") ?? false,
        source,
        documentation: method.DeveloperDocumentation || void 0
      };
      return this.enhancedParser.parseMethodEnhanced(baseMethod, parentClass);
    });
  }
  /**
   * The method's access modifier, read from the declaration that was just parsed.
   *
   * It used to be read from a `<Method><Visibility>` element, which real AxClass
   * XML does not have — so every method in the AOT fell through to 'public',
   * including the protected ones, and `get_object_info` printed
   * `- **Visibility:** public` under each of them (#902). The modifiers were in
   * hand two lines above the call all along.
   *
   * The element is still honoured as a fallback for hand-written/synthetic XML
   * and for a declaration too malformed to parse; only then does the X++ default
   * of public apply.
   */
  parseVisibility(modifiers, vis) {
    const declared = modifiers ? visibilityFromModifiers(modifiers) : void 0;
    if (declared) return declared;
    if (modifiers) return "public";
    if (!vis) return "public";
    const lower = vis.toLowerCase();
    if (lower === "private" || lower === "protected" || lower === "internal") return lower;
    return "public";
  }
  /**
   * Parses <AxTableField i:type="AxTableFieldString"> nodes; the field type
   * comes from the i:type XML attribute (field.$['i:type']), not an element.
   */
  parseFields(fieldsData) {
    if (!fieldsData) return [];
    const fields = Array.isArray(fieldsData) ? fieldsData : [fieldsData];
    return fields.map((field) => {
      const rawType = field.$?.["i:type"] || "AxTableFieldString";
      const xppType = rawType.replace("AxTableField", "") || "String";
      return {
        name: field.Name || "unknown",
        type: xppType,
        extendedDataType: field.ExtendedDataType || void 0,
        enumType: field.EnumType || void 0,
        mandatory: field.Mandatory === "Yes" || field.Mandatory === "true",
        label: field.Label || void 0
      };
    });
  }
  parseIndexes(indexesData) {
    if (!indexesData) return [];
    const indexes = Array.isArray(indexesData) ? indexesData : [indexesData];
    return indexes.map((index) => ({
      name: index.Name || "unknown",
      fields: this.parseIndexFields(index.Fields),
      // Uniqueness is marked via AlternateKey, not AllowDuplicates
      unique: index.AlternateKey === "Yes" || index.AlternateKey === "true",
      clustered: index.IsClustered === "Yes" || index.IsClustered === "true"
    }));
  }
  parseIndexFields(fieldsStr) {
    if (!fieldsStr) return [];
    if (fieldsStr.AxTableIndexField) {
      const indexFields = Array.isArray(fieldsStr.AxTableIndexField) ? fieldsStr.AxTableIndexField : [fieldsStr.AxTableIndexField];
      return indexFields.map((field) => field?.DataField || field?.Name || "").filter((field) => !!field);
    }
    if (typeof fieldsStr !== "string") {
      if (Array.isArray(fieldsStr)) {
        return fieldsStr.map((field) => {
          if (typeof field === "string") {
            return field;
          }
          if (field?.DataField) {
            return field.DataField;
          }
          if (field?.Name) {
            return field.Name;
          }
          return "";
        }).filter(Boolean);
      }
      return [];
    }
    return fieldsStr.split(",").map((f) => f.trim()).filter(Boolean);
  }
  parseRelations(relationsData) {
    if (!relationsData) return [];
    const relations = Array.isArray(relationsData) ? relationsData : [relationsData];
    return relations.map((rel) => ({
      name: rel.Name || "unknown",
      relatedTable: rel.RelatedTable || "unknown",
      constraints: this.parseConstraints(rel.Constraints)
    }));
  }
  parseConstraints(constraintsData) {
    if (!constraintsData) return [];
    const constraintNodes = constraintsData.AxTableRelationConstraint ? Array.isArray(constraintsData.AxTableRelationConstraint) ? constraintsData.AxTableRelationConstraint : [constraintsData.AxTableRelationConstraint] : Array.isArray(constraintsData) ? constraintsData : [constraintsData];
    return constraintNodes.map((constraint) => ({
      field: constraint.Field || "",
      relatedField: constraint.RelatedField || ""
    }));
  }
  parseViewFields(fieldsData) {
    if (!fieldsData) return [];
    const entityFields = this.ensureArray(fieldsData.AxDataEntityViewField);
    const viewFields = this.ensureArray(fieldsData.AxViewField);
    const allFields = [...entityFields, ...viewFields];
    return allFields.map((field) => ({
      name: field.Name || "unknown",
      dataSource: field.DataSource || void 0,
      dataField: field.DataField || void 0,
      dataMethod: field.DataMethod || void 0,
      labelId: this.extractLabelId(field.Label),
      isComputed: !!field.DataMethod
    }));
  }
  parseViewRelations(relationsData) {
    if (!relationsData) return [];
    const entityRelations = this.ensureArray(relationsData.AxDataEntityViewRelation);
    const viewRelations = this.ensureArray(relationsData.AxViewRelation);
    const allRelations = [...entityRelations, ...viewRelations];
    return allRelations.map((relation) => ({
      name: relation.Name || "unknown",
      relatedTable: relation.RelatedDataEntity || relation.RelatedTable || "unknown",
      relationType: relation.RelationType || "Unknown",
      cardinality: relation.Cardinality || "Unknown",
      fields: this.parseViewRelationFields(relation)
    }));
  }
  parseViewPrimaryKeyFields(keysData, primaryKeyName) {
    if (!keysData) return [];
    const keys = this.ensureArray(keysData.AxDataEntityViewKey);
    const keyNode = primaryKeyName ? keys.find((key) => key.Name === primaryKeyName) : keys[0];
    if (!keyNode || !keyNode.Fields) return [];
    const keyFields = this.ensureArray(keyNode.Fields.AxDataEntityViewKeyField);
    return keyFields.map((field) => field.DataField || field.Name || "").filter((field) => !!field);
  }
  parseViewRelationFields(relation) {
    const mappings = [];
    const relationFields = this.ensureArray(relation?.Fields?.AxDataEntityViewRelationField);
    for (const field of relationFields) {
      mappings.push({
        field: field.DataField || field.Field || field.Name || "",
        relatedField: field.RelatedDataField || field.RelatedField || ""
      });
    }
    const constraints = this.ensureArray(relation?.Constraints?.AxDataEntityViewRelationConstraint);
    for (const constraint of constraints) {
      mappings.push({
        field: constraint.DataField || constraint.Field || "",
        relatedField: constraint.RelatedDataField || constraint.RelatedField || ""
      });
    }
    return mappings.filter((mapping) => !!mapping.field || !!mapping.relatedField);
  }
  extractLabelId(labelValue) {
    if (!labelValue || typeof labelValue !== "string") return void 0;
    const trimmed = labelValue.trim();
    if (!trimmed.startsWith("@")) return void 0;
    return trimmed;
  }
  ensureArray(value) {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }
  /**
   * Declaration parameters narrowed to the shape XppMethodInfo carries.
   * A null decl yields `[]`; the `parametersUnknown` flag set alongside is what
   * tells that apart from a genuinely empty list, so don't read this alone.
   */
  toParameterInfo(decl) {
    return decl?.parameters.map((p) => p.defaultValue ? { type: p.type, name: p.name, defaultValue: p.defaultValue } : { type: p.type, name: p.name }) ?? [];
  }
  /**
   * Parse Form XML file (AxForm)
   */
  async parseFormFile(filePath, model) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      if (!parsed.AxForm) {
        return { success: false, error: "Not a valid AxForm file" };
      }
      const axForm = parsed.AxForm;
      const formName = axForm.Name || "UnknownForm";
      const formInfo = {
        name: formName,
        model: model || "Unknown",
        sourcePath: filePath,
        label: axForm.Label || void 0,
        caption: axForm.Caption || axForm.TitleDatasource || void 0,
        formPattern: void 0,
        // Will be detected from Design
        formPatternVersion: void 0,
        dataSources: [],
        design: [],
        patternNodes: [],
        methods: []
      };
      if (axForm.DataSources && typeof axForm.DataSources === "object") {
        formInfo.dataSources = this.extractFormDataSources(axForm.DataSources);
      }
      if (axForm.Design && typeof axForm.Design === "object") {
        const designInfo = walkFormDesign(axForm.Design);
        formInfo.design = designInfo.controls;
        formInfo.formPattern = designInfo.pattern || designInfo.style;
        formInfo.formPatternVersion = designInfo.patternVersion;
        formInfo.patternNodes = collectPatternNodes(designInfo);
      }
      const methodsNode = axForm.SourceCode?.Methods ?? axForm.Methods;
      if (methodsNode && typeof methodsNode === "object") {
        formInfo.methods = this.extractFormMethods(methodsNode, formName);
      }
      return { success: true, data: formInfo };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  /**
   * Extract form datasources
   */
  extractFormDataSources(dataSourcesNode) {
    const dataSources = [];
    const dsData = dataSourcesNode.AxFormDataSource || dataSourcesNode.AxFormDataSourceRoot;
    if (!dsData) {
      return dataSources;
    }
    const dsRoots = this.ensureArray(dsData);
    for (const dsNode of dsRoots) {
      const ds = {
        name: dsNode.Name || "Unknown",
        table: dsNode.Table || "Unknown",
        allowEdit: dsNode.AllowEdit === "Yes" || dsNode.AllowEdit === "true",
        allowCreate: dsNode.AllowCreate === "Yes" || dsNode.AllowCreate === "true",
        allowDelete: dsNode.AllowDelete === "Yes" || dsNode.AllowDelete === "true",
        fields: [],
        methods: []
      };
      if (dsNode.Fields && this.ensureArray(dsNode.Fields).length > 0) {
        const fieldsNode = this.ensureArray(dsNode.Fields)[0];
        if (fieldsNode.AxFormDataSourceField) {
          const fieldNodes = this.ensureArray(fieldsNode.AxFormDataSourceField);
          ds.fields = fieldNodes.map((f) => f.DataField || "Unknown").filter((name) => name !== "Unknown");
        }
      }
      if (dsNode.Methods && this.ensureArray(dsNode.Methods).length > 0) {
        const methodsNode = this.ensureArray(dsNode.Methods)[0];
        if (methodsNode.Method) {
          const methodNodes = this.ensureArray(methodsNode.Method);
          ds.methods = methodNodes.map((m) => m.Name || "Unknown");
        }
      }
      dataSources.push(ds);
    }
    return dataSources;
  }
  /**
   * Extract form methods
   */
  extractFormMethods(methodsNode, _formName) {
    const methods = [];
    if (!methodsNode.Method) {
      return methods;
    }
    const methodNodes = this.ensureArray(methodsNode.Method);
    for (const methodNode of methodNodes) {
      const name = methodNode.Name || "Unknown";
      const source = methodNode.Source || "";
      const decl = parseXppDeclaration(source, name);
      const methodInfo = {
        name,
        visibility: "public",
        // Forms typically have public methods
        returnType: decl?.returnType || "void",
        parameters: this.toParameterInfo(decl),
        parametersUnknown: decl === null,
        isStatic: decl?.modifiers.includes("static") ?? false,
        source,
        sourceSnippet: source.split("\n").slice(0, 10).join("\n")
      };
      methods.push(methodInfo);
    }
    return methods;
  }
  /**
   * Parse EDT XML file (AxEdt)
   */
  async parseEdtFile(filePath, model) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      if (!parsed.AxEdt) {
        return { success: false, error: "Not a valid AxEdt file" };
      }
      const axEdt = parsed.AxEdt;
      const edtName = axEdt.Name || "UnknownEDT";
      const getValue = (key) => {
        const raw = axEdt[key];
        if (!raw) return void 0;
        const value = Array.isArray(raw) ? raw[0] : raw;
        return typeof value === "string" && value.trim().length > 0 ? value : void 0;
      };
      const edtInfo = {
        name: edtName,
        model: model || "Unknown",
        sourcePath: filePath,
        extends: getValue("Extends"),
        enumType: getValue("EnumType"),
        referenceTable: getValue("ReferenceTable"),
        relationType: getValue("RelationType"),
        stringSize: getValue("StringSize"),
        databaseStringSize: getValue("DatabaseStringSize"),
        displayLength: getValue("DisplayLength"),
        label: getValue("Label"),
        helpText: getValue("HelpText"),
        formHelp: getValue("FormHelp"),
        configurationKey: getValue("ConfigurationKey"),
        alignment: getValue("Alignment"),
        decimalSeparator: getValue("DecimalSeparator"),
        signDisplay: getValue("SignDisplay"),
        noOfDecimals: getValue("NoOfDecimals"),
        additionalProperties: {}
      };
      const knownProperties = /* @__PURE__ */ new Set([
        "Name",
        "Extends",
        "EnumType",
        "ReferenceTable",
        "RelationType",
        "StringSize",
        "DisplayLength",
        "DatabaseStringSize",
        "Label",
        "HelpText",
        "FormHelp",
        "ConfigurationKey",
        "Alignment",
        "DecimalSeparator",
        "SignDisplay",
        "NoOfDecimals",
        "ArrayElements",
        "Relations",
        "TableReferences"
      ]);
      for (const [key, value] of Object.entries(axEdt)) {
        if (knownProperties.has(key)) continue;
        const first = Array.isArray(value) ? value[0] : value;
        if (typeof first === "string" && first.trim().length > 0) {
          edtInfo.additionalProperties[key] = first;
        }
      }
      return { success: true, data: edtInfo };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  async parseSecurityPrivilegeFile(filePath) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      const root = parsed?.AxSecurityPrivilege;
      if (!root) return { success: false, error: "Not an AxSecurityPrivilege file" };
      const name = root.Name || "";
      const label = root.Label || void 0;
      const rawEps = root.EntryPoints?.AxSecurityEntryPointReference;
      const epArray = rawEps ? Array.isArray(rawEps) ? rawEps : [rawEps] : [];
      const entryPoints = epArray.map((ep) => {
        const rawAccess = ep.Grant ?? ep.Access;
        let accessLevel;
        if (rawAccess == null) {
          accessLevel = "";
        } else if (typeof rawAccess === "object") {
          accessLevel = Object.entries(rawAccess).map(([k, v]) => `${k}:${v}`).join(",");
        } else {
          accessLevel = String(rawAccess);
        }
        return { name: ep.Name || "", objectName: ep.ObjectName || ep.Name || "", objectType: ep.ObjectType || "", accessLevel };
      }).filter((ep) => ep.name);
      return { success: true, data: { name, label, sourcePath: filePath, entryPoints } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  async parseSecurityDutyFile(filePath) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      const root = parsed?.AxSecurityDuty;
      if (!root) return { success: false, error: "Not an AxSecurityDuty file" };
      const name = root.Name || "";
      const label = root.Label || void 0;
      const rawPrivs = root.Privileges?.AxSecurityPrivilegeReference ?? root.Privileges?.AxSecurityRolePermissionSet ?? root.Privileges?.AxSecurityPrivilegePermissionSet;
      const privArray = rawPrivs ? Array.isArray(rawPrivs) ? rawPrivs : [rawPrivs] : [];
      const privileges = privArray.map((p) => typeof p === "string" ? p : p.Name || "").filter(Boolean);
      return { success: true, data: { name, label, sourcePath: filePath, privileges } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  async parseSecurityRoleFile(filePath) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      const root = parsed?.AxSecurityRole;
      if (!root) return { success: false, error: "Not an AxSecurityRole file" };
      const name = root.Name || "";
      const label = root.Label || void 0;
      const description = root.Description || void 0;
      const rawDuties = root.Duties?.AxSecurityDutyReference ?? root.Duties?.AxSecurityRoleDutyPermission ?? root.Duties?.AxSecurityDutyPermission;
      const dutyArray = rawDuties ? Array.isArray(rawDuties) ? rawDuties : [rawDuties] : [];
      const duties = dutyArray.map((d) => typeof d === "string" ? d : d.Name || "").filter(Boolean);
      return { success: true, data: { name, label, description, sourcePath: filePath, duties } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  async parseMenuItemFile(filePath, itemType) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      const rootKey = itemType === "display" ? "AxMenuItemDisplay" : itemType === "action" ? "AxMenuItemAction" : "AxMenuItemOutput";
      const root = parsed?.[rootKey];
      if (!root) return { success: false, error: `Not an ${rootKey} file` };
      return {
        success: true,
        data: {
          name: root.Name || "",
          label: root.Label || void 0,
          targetObject: root.Object || void 0,
          targetType: root.ObjectType || void 0,
          securityPrivilege: root.SecurityPrivilege || void 0,
          sourcePath: filePath
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  async parseExtensionFile(filePath, extensionType) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      const rootKeyMap = {
        "table-extension": "AxTableExtension",
        // Not AxClassExtension: a class extension is an AxClass file carrying
        // [ExtensionOf(...)], so its root element is AxClass like any other class (#693).
        "class-extension": "AxClass",
        "form-extension": "AxFormExtension",
        "enum-extension": "AxEnumExtension",
        "edt-extension": "AxEdtExtension",
        "data-entity-extension": "AxDataEntityViewExtension",
        "view-extension": "AxViewExtension",
        "query-extension": "AxQuerySimpleExtension",
        "map-extension": "AxMapExtension",
        "menu-extension": "AxMenuExtension",
        "security-duty-extension": "AxSecurityDutyExtension",
        "security-role-extension": "AxSecurityRoleExtension",
        "menu-item-display-extension": "AxMenuItemDisplayExtension",
        "menu-item-action-extension": "AxMenuItemActionExtension",
        "menu-item-output-extension": "AxMenuItemOutputExtension"
      };
      const rootKey = rootKeyMap[extensionType] || Object.keys(parsed || {})[0] || "";
      const root = parsed?.[rootKey];
      if (!root) return { success: false, error: `Cannot parse extension type: ${extensionType}` };
      const name = root.Name || "";
      let baseObjectName = root.Extends || root.BaseObject || "";
      if (!baseObjectName) {
        baseObjectName = parseExtensionOfAttribute(this.cdataText(root.SourceCode?.Declaration))?.baseObjectName || "";
      }
      if (!baseObjectName && name.includes(".")) {
        baseObjectName = name.slice(0, name.indexOf("."));
      }
      const rawFields = root.Fields?.AxTableField ?? root.Fields?.AxEdtField ?? root.Fields?.AxViewField ?? root.Fields?.AxMapField ?? root.Fields?.AxQueryExtensionQueryDataSourceField ?? [];
      const fieldArr = Array.isArray(rawFields) ? rawFields : rawFields ? [rawFields] : [];
      const addedFields = fieldArr.map((f) => f.Name || f.QueryDataSourceField?.Name || "").filter(Boolean);
      const rawIndexes = root.Indexes?.AxTableIndex ?? [];
      const indexArr = Array.isArray(rawIndexes) ? rawIndexes : rawIndexes ? [rawIndexes] : [];
      const addedIndexes = indexArr.map((i) => i.Name || "").filter(Boolean);
      const rawMethods = root.SourceCode?.Methods?.Method ?? root.Methods?.Method ?? [];
      const methodArr = Array.isArray(rawMethods) ? rawMethods : rawMethods ? [rawMethods] : [];
      const { addedMethods, cocMethods, eventSubscriptions } = extensionMembersFrom(
        methodArr.map((m) => ({
          name: m.Name || "",
          source: typeof m.Source === "string" ? m.Source : m._ || ""
        }))
      );
      return {
        success: true,
        data: {
          name,
          baseObjectName,
          sourcePath: filePath,
          addedFields,
          addedMethods,
          addedIndexes,
          cocMethods,
          eventSubscriptions
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  /**
   * Parse an AxService file: backing class, external name, namespace, and the
   * exposed service operations (each maps to a public method on the class).
   */
  async parseServiceFile(filePath) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      const root = parsed?.AxService;
      if (!root) return { success: false, error: "Not an AxService file" };
      const rawOps = root.ServiceOperations?.AxServiceOperation;
      const opArr = Array.isArray(rawOps) ? rawOps : rawOps ? [rawOps] : [];
      const operations = opArr.map((o) => ({
        name: o.Name || "",
        method: o.Method || o.Name || "",
        idempotent: String(o.EnableIdempotence || "").toLowerCase() === "yes"
      })).filter((o) => o.name);
      return {
        success: true,
        data: {
          name: root.Name || "",
          serviceClass: root.Class || void 0,
          externalName: root.ExternalName || void 0,
          namespace: root.Namespace || void 0,
          sourcePath: filePath,
          operations
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  /**
   * Parse an AxMap file: the X++ map class (methods) and its table mappings
   * (each mapping binds the map to a table via field connections).
   */
  async parseMapFile(filePath) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      const root = parsed?.AxMap;
      if (!root) return { success: false, error: "Not an AxMap file" };
      const decl = root.SourceCode?.Declaration || "";
      const extendsMatch = decl.match(/\bextends\s+(\w+)/i);
      const rawMethods = root.SourceCode?.Methods?.Method;
      const methodArr = Array.isArray(rawMethods) ? rawMethods : rawMethods ? [rawMethods] : [];
      const methods = methodArr.map((m) => m.Name || "").filter(Boolean);
      const rawMappings = root.Mappings?.AxTableMapping;
      const mapArr = Array.isArray(rawMappings) ? rawMappings : rawMappings ? [rawMappings] : [];
      const mappings = mapArr.map((m) => {
        const rawConn = m.Connections?.AxTableMappingConnection;
        const connArr = Array.isArray(rawConn) ? rawConn : rawConn ? [rawConn] : [];
        return { table: m.MappingTable || "", fieldConnections: connArr.length };
      }).filter((m) => m.table);
      return {
        success: true,
        data: { name: root.Name || "", extends: extendsMatch?.[1], sourcePath: filePath, methods, mappings }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  /** Parse an AxConfigurationKey file: label + parent key (feature gating tree). */
  async parseConfigurationKeyFile(filePath) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      const root = parsed?.AxConfigurationKey;
      if (!root) return { success: false, error: "Not an AxConfigurationKey file" };
      return {
        success: true,
        data: { name: root.Name || "", label: root.Label || void 0, parentKey: root.ParentKey || void 0, sourcePath: filePath }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  /** Parse an AxLicenseCode file: group, package, type (license-based feature gating). */
  async parseLicenseCodeFile(filePath) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      const root = parsed?.AxLicenseCode;
      if (!root) return { success: false, error: "Not an AxLicenseCode file" };
      return {
        success: true,
        data: {
          name: root.Name || "",
          label: root.Label || void 0,
          group: root.Group || void 0,
          licensePackage: root.Package || void 0,
          type: root.Type || void 0,
          sourcePath: filePath
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  /** Parse an AxSecurityPolicy file: row-level (OLS) policy on a primary table. */
  async parseSecurityPolicyFile(filePath) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      const root = parsed?.AxSecurityPolicy;
      if (!root) return { success: false, error: "Not an AxSecurityPolicy file" };
      return {
        success: true,
        data: {
          name: root.Name || "",
          label: root.Label || void 0,
          primaryTable: root.PrimaryTable || void 0,
          query: root.Query || void 0,
          operation: root.Operation || void 0,
          constrainedTable: String(root.ConstrainedTable || "").toLowerCase() === "yes",
          sourcePath: filePath
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  /** Parse an AxMacroDictionary file: the #define entries of a shared macro library. */
  async parseMacroFile(filePath) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      const root = parsed?.AxMacroDictionary;
      if (!root) return { success: false, error: "Not an AxMacroDictionary file" };
      const source = typeof root.Source === "string" ? root.Source : root.Source?._ || "";
      const defines = [];
      const re = /#define\.(\w+)\s*(?:\(([^)]*)\))?/g;
      let m;
      while ((m = re.exec(source)) !== null) {
        defines.push({ name: m[1], value: (m[2] ?? "").trim() });
      }
      return { success: true, data: { name: root.Name || "", sourcePath: filePath, defines } };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
  /**
   * Parse an AxServiceGroup file: member services and deployment flag.
   */
  async parseServiceGroupFile(filePath) {
    try {
      const content = await fs2.readFile(filePath, "utf-8");
      const parsed = await this.parser.parseStringPromise(content);
      const root = parsed?.AxServiceGroup;
      if (!root) return { success: false, error: "Not an AxServiceGroup file" };
      const rawSvc = root.Services?.AxServiceGroupService;
      const svcArr = Array.isArray(rawSvc) ? rawSvc : rawSvc ? [rawSvc] : [];
      const services = svcArr.map((s) => s.Service || s.Name || "").filter(Boolean);
      return {
        success: true,
        data: {
          name: root.Name || "",
          autoDeploy: String(root.AutoDeploy || "").toLowerCase() === "yes",
          description: root.Description || void 0,
          sourcePath: filePath,
          services
        }
      };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }
};

// src/utils/modelClassifier.ts
var autoDetectedCustomModels = /* @__PURE__ */ new Set();
function isAutoDetectedCustomModel(modelName) {
  return autoDetectedCustomModels.has(modelName);
}
function getCustomModels() {
  return process.env.CUSTOM_MODELS?.split(",").map((m) => m.trim()).filter(Boolean) || [];
}
function getExtensionPrefix() {
  return process.env.EXTENSION_PREFIX || "";
}
function getConfiguredModelName() {
  return process.env.D365FO_MODEL_NAME?.trim() || "";
}
function matchesPattern(pattern, modelName) {
  const patternLower = pattern.toLowerCase();
  const modelLower = modelName.toLowerCase();
  if (!patternLower.includes("*")) {
    return patternLower === modelLower;
  }
  const regexPattern = patternLower.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(modelLower);
}
function isCustomModel(modelName) {
  if (isAutoDetectedCustomModel(modelName)) {
    return true;
  }
  const configuredModel = getConfiguredModelName();
  if (configuredModel && configuredModel.toLowerCase() === modelName.toLowerCase()) {
    return true;
  }
  const customModels = getCustomModels();
  const extensionPrefix = getExtensionPrefix();
  const isInCustomList = customModels.some((pattern) => matchesPattern(pattern, modelName));
  const hasExtensionPrefix = matchesExtensionPrefix(extensionPrefix, modelName);
  return isInCustomList || hasExtensionPrefix;
}
function matchesExtensionPrefix(extensionPrefix, modelName) {
  const rawPrefix = extensionPrefix.trim().toLowerCase();
  if (!rawPrefix) return false;
  const effective = rawPrefix.replace(/_+$/, "") || rawPrefix;
  return modelName.toLowerCase().startsWith(effective);
}

// src/utils/extractManifest.ts
import * as fs3 from "fs";
import * as path from "path";
var EXTRACT_MANIFEST_FILENAME = ".extract-manifest.json";
function manifestPath(metadataDir) {
  return path.join(metadataDir, EXTRACT_MANIFEST_FILENAME);
}
function writeExtractManifest(metadataDir, manifest) {
  fs3.writeFileSync(manifestPath(metadataDir), JSON.stringify(manifest, null, 2));
}

// src/utils/blobDownloadMarker.ts
import * as fs4 from "fs";
import * as path2 from "path";
var BLOB_DOWNLOAD_MARKER_FILENAME = ".blob-download.json";
function markerPath(metadataDir) {
  return path2.join(metadataDir, BLOB_DOWNLOAD_MARKER_FILENAME);
}
function readBlobDownloadMarker(metadataDir) {
  try {
    const parsed = JSON.parse(fs4.readFileSync(markerPath(metadataDir), "utf-8"));
    if (typeof parsed.downloadedAt !== "string") return void 0;
    return {
      downloadedAt: parsed.downloadedAt,
      modelType: typeof parsed.modelType === "string" ? parsed.modelType : "unknown",
      models: Array.isArray(parsed.models) ? parsed.models.filter((m) => typeof m === "string") : [],
      fileCount: typeof parsed.fileCount === "number" ? parsed.fileCount : 0
    };
  } catch {
    return void 0;
  }
}

// src/utils/xppConfigProvider.ts
import * as fs5 from "fs/promises";
import * as path3 from "path";
var XppConfigProvider = class {
  configDir;
  cache = null;
  constructor(configDir) {
    this.configDir = configDir || path3.join(
      process.env.LOCALAPPDATA || path3.join(process.env.USERPROFILE || "", "AppData", "Local"),
      "Microsoft",
      "Dynamics365",
      "XPPConfig"
    );
  }
  /**
   * Parse a config filename into name + version.
   * Pattern: {name}___{version}.json
   */
  parseConfigFilename(filename) {
    const match = filename.match(/^(.+)___(.+)\.json$/);
    if (!match) return null;
    return { configName: match[1], version: match[2] };
  }
  /**
   * List all available XPP configs, sorted by modification time (newest first).
   */
  async listConfigs() {
    if (this.cache) return [...this.cache];
    let entries;
    try {
      entries = await fs5.readdir(this.configDir, { withFileTypes: true });
    } catch {
      return [];
    }
    const jsonFiles = entries.filter((e) => e.isFile() && e.name.endsWith(".json"));
    const withStats = await Promise.all(
      jsonFiles.map(async (entry) => {
        const fullPath = path3.join(this.configDir, entry.name);
        try {
          const stat2 = await fs5.stat(fullPath);
          return { entry, mtime: stat2.mtimeMs };
        } catch {
          return null;
        }
      })
    );
    const valid = withStats.filter(Boolean);
    valid.sort((a, b) => b.mtime - a.mtime);
    const configs = [];
    for (const { entry } of valid) {
      const parsed = this.parseConfigFilename(entry.name);
      if (!parsed) continue;
      const fullPath = path3.join(this.configDir, entry.name);
      try {
        const raw = await fs5.readFile(fullPath, "utf-8");
        const json = JSON.parse(raw);
        if (!json.ModelStoreFolder || !json.FrameworkDirectory) continue;
        configs.push({
          configName: parsed.configName,
          version: parsed.version,
          customPackagesPath: json.ModelStoreFolder,
          microsoftPackagesPath: json.FrameworkDirectory,
          referencePackagesPaths: json.ReferencePackagesPaths ?? [],
          xrefDbName: json.CrossReferencesDatabaseName,
          xrefDbServer: json.CrossReferencesDbServerName,
          description: json.Description,
          fullFilename: entry.name.replace(/\.json$/, "")
        });
      } catch (err) {
        console.warn(`[XppConfigProvider] Skipping malformed config "${entry.name}":`, err instanceof SyntaxError ? "invalid JSON" : String(err));
      }
    }
    this.cache = configs;
    return configs;
  }
  /**
   * Get the active XPP config.
   * If configName is provided, selects that specific config.
   * Otherwise auto-selects the newest.
   */
  async getActiveConfig(configName) {
    const configs = await this.listConfigs();
    if (configs.length === 0) return null;
    if (configName) {
      return configs.find(
        (c2) => c2.fullFilename === configName || c2.configName === configName
      ) || null;
    }
    if (configs.length > 1) {
      const names = configs.map((c2) => c2.fullFilename).join(", ");
      console.warn(
        `[XppConfigProvider] XPP_CONFIG_NAME is not set and ${configs.length} configs were found (${names}). Auto-selecting the newest: "${configs[0].fullFilename}". Set XPP_CONFIG_NAME in your .env file to pin a specific config and avoid unpredictable behaviour when running multiple server instances.`
      );
    }
    return configs[0];
  }
  /**
   * Check if XPP configs exist (indicates UDE environment).
   */
  async hasConfigs() {
    const configs = await this.listConfigs();
    return configs.length > 0;
  }
  /**
   * Invalidate cached config list.
   */
  clearCache() {
    this.cache = null;
  }
};

// src/utils/packagesRoot.ts
import * as fs6 from "fs";
var FALLBACK_PACKAGES_ROOT = "C:\\AosService\\PackagesLocalDirectory";
var PREFERRED_DRIVES = ["C", "K", "J", "I"];
var SCANNED_DRIVES = "CDEFGHIJKLMNOPQRSTUVWXYZ".split("");
var realIo = {
  // Read through to process.platform on every access rather than snapshotting it
  // at import time — a frozen copy makes the scan ignore a platform override, so
  // the "not on Windows" path can only be exercised on a non-Windows machine and
  // the corresponding test silently passes on CI while failing on a real VM.
  get platform() {
    return process.platform;
  },
  isDirectory(target) {
    try {
      return fs6.statSync(target).isDirectory();
    } catch {
      return false;
    }
  },
  readDir(target) {
    try {
      return fs6.readdirSync(target);
    } catch {
      return [];
    }
  }
};
function plausibility(root, io) {
  const entries = io.readDir(root);
  if (entries.length === 0) return 0;
  if (entries.some((e) => e.toLowerCase() === "bin")) return 2;
  return 1;
}
function scanPackagesRoots(io = realIo) {
  if (io.platform !== "win32") return [];
  const hits = [];
  for (const letter of SCANNED_DRIVES) {
    if (!io.isDirectory(`${letter}:\\`)) continue;
    const root = `${letter}:\\AosService\\PackagesLocalDirectory`;
    if (!io.isDirectory(root)) continue;
    const preferred = PREFERRED_DRIVES.indexOf(letter);
    hits.push({
      root,
      score: plausibility(root, io),
      rank: preferred === -1 ? PREFERRED_DRIVES.length : preferred
    });
  }
  return hits.sort((a, b) => b.score - a.score || a.rank - b.rank || a.root.localeCompare(b.root)).map((hit) => hit.root);
}
var cached = null;
function packagesRoots() {
  if (cached === null) cached = scanPackagesRoots();
  return cached;
}
function findPackagesRoot() {
  return packagesRoots()[0] ?? null;
}
function defaultPackagesRoot() {
  return findPackagesRoot() ?? FALLBACK_PACKAGES_ROOT;
}

// src/utils/terminalUi.ts
import { relative, isAbsolute as isAbsolute3, sep } from "path";
var isWin = process.platform === "win32";
var supportsUnicode = (() => {
  if (process.env.FORCE_UNICODE === "1") return true;
  if (process.env.FORCE_UNICODE === "0") return false;
  if (!isWin) return process.env.TERM !== "linux";
  return Boolean(process.env.WT_SESSION) || // Windows Terminal
  process.env.TERM_PROGRAM === "vscode" || Boolean(process.env.ConEmuTask) || // ConEmu / Cmder
  process.env.TERM === "xterm-256color" || process.env.WSLENV !== void 0;
})();
var supportsColor = (() => {
  if (process.env.FORCE_COLOR && process.env.FORCE_COLOR !== "0") return true;
  if ("NO_COLOR" in process.env) return false;
  if (process.env.TERM === "dumb") return false;
  return Boolean(process.stdout.isTTY);
})();
var wrap = (open, close) => (s) => supportsColor ? `\x1B[${open}m${s}\x1B[${close}m` : s;
var c = {
  bold: wrap(1, 22),
  dim: wrap(2, 22),
  red: wrap(31, 39),
  green: wrap(32, 39),
  yellow: wrap(33, 39),
  blue: wrap(34, 39),
  magenta: wrap(35, 39),
  cyan: wrap(36, 39),
  gray: wrap(90, 39)
};
var U = supportsUnicode;
var glyph = {
  tl: U ? "\u256D" : "+",
  tr: U ? "\u256E" : "+",
  bl: U ? "\u2570" : "+",
  br: U ? "\u256F" : "+",
  h: U ? "\u2500" : "-",
  v: U ? "\u2502" : "|",
  dot: U ? "\xB7" : "-",
  ok: U ? "\u2713" : "OK",
  warn: U ? "\u25B2" : "!",
  err: U ? "\u2717" : "x",
  info: U ? "\u2139" : "i",
  arrow: U ? "\u203A" : ">",
  bullet: U ? "\u2022" : "*",
  ellipsis: U ? "\u2026" : "..."
};
var EMOJI_TAGS = [
  [/✅|✔️?/g, "[OK]"],
  [/❌/g, "[X]"],
  [/⚠️?/g, "[!]"],
  [/ℹ️?/g, "[i]"],
  [/⏭️?/g, "[skip]"]
];
var EMOJI_STRIP = /(?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}\u{2190}-\u{21FF}\u{2300}-\u{23FF}])+ */gu;
var PUNCT_MAP = [
  [/[—–‒―]/g, "-"],
  [/…/g, "..."],
  [/[·•]/g, "-"],
  [/[‘’‛]/g, "'"],
  [/[“”‟]/g, '"'],
  [/[‹›]/g, ">"],
  [/→/g, "->"],
  [/×/g, "x"],
  [/ /g, " "]
  // non-breaking space
];
function sanitize(text) {
  if (supportsUnicode) return text;
  let out = text;
  for (const [re, tag] of EMOJI_TAGS) out = out.replace(re, tag);
  out = out.replace(EMOJI_STRIP, "");
  for (const [re, rep] of PUNCT_MAP) out = out.replace(re, rep);
  return out;
}
var ANSI_RE = /\x1b\[[0-9;]*m/g;
function visibleLen(s) {
  return s.replace(ANSI_RE, "").length;
}
function padEndVisible(s, width) {
  const pad = width - visibleLen(s);
  return pad > 0 ? s + " ".repeat(pad) : s;
}
function box(rows, minWidth = 48) {
  const inner = Math.max(minWidth, ...rows.map(visibleLen));
  const top = c.gray(glyph.tl + glyph.h.repeat(inner + 2) + glyph.tr);
  const bottom = c.gray(glyph.bl + glyph.h.repeat(inner + 2) + glyph.br);
  const body = rows.map(
    (r) => c.gray(glyph.v) + " " + padEndVisible(r, inner) + " " + c.gray(glyph.v)
  );
  return [top, ...body, bottom];
}
function spread(left, right, width) {
  const gap = Math.max(1, width - visibleLen(left) - visibleLen(right));
  return left + " ".repeat(gap) + right;
}
function kv(label, value, labelWidth = 9) {
  return "  " + c.dim(padEndVisible(label, labelWidth)) + value;
}
function sectionTitle(title) {
  return "  " + c.bold(c.cyan(title.toUpperCase()));
}
function statusLine(kind, msg) {
  const map = {
    step: [glyph.arrow, c.cyan],
    ok: [glyph.ok, c.green],
    warn: [glyph.warn, c.yellow],
    err: [glyph.err, c.red],
    info: [glyph.info, c.gray]
  };
  const [g, paint] = map[kind];
  return "  " + paint(g) + " " + msg;
}
var startupWarnings = [];
var log = {
  step: (msg) => console.log(statusLine("step", msg)),
  ok: (msg) => console.log(statusLine("ok", msg)),
  info: (msg) => console.log(statusLine("info", msg)),
  warn: (msg) => {
    startupWarnings.push(msg);
    console.error(statusLine("warn", msg));
  },
  err: (msg) => console.error(statusLine("err", msg)),
  detail: (msg) => console.log("      " + c.dim(msg))
};
function shortPath(p, cwd = process.cwd()) {
  const rel = relative(cwd, p);
  return rel && !rel.startsWith("..") && !isAbsolute3(rel) ? "." + sep + rel : p;
}

// scripts/extract-metadata.ts
var __filename = fileURLToPath2(import.meta.url);
var __dirname = path4.dirname(__filename);
if (!supportsUnicode) {
  const wrapWrite = (stream) => {
    const orig = stream.write.bind(stream);
    stream.write = (chunk, ...rest) => typeof chunk === "string" ? orig(sanitize(chunk), ...rest) : orig(chunk, ...rest);
  };
  wrapWrite(process.stdout);
  wrapWrite(process.stderr);
}
var PACKAGES_PATH = process.env.D365FO_PACKAGE_PATH || defaultPackagesRoot();
var OUTPUT_PATH = process.env.METADATA_PATH || "./extracted-metadata";
var CUSTOM_MODELS = getCustomModels();
var EXTRACT_MODE = process.env.EXTRACT_MODE || "all";
var isCustomModel2 = isCustomModel;
function classifyCustom(rootPath, customRoot, modelName, customModels = CUSTOM_MODELS) {
  const isCustom = customRoot ? rootPath === customRoot : isCustomModel2(modelName);
  const narrowedByConfig = !!customRoot && customModels.length > 0 && !isCustomModel2(modelName);
  return { isCustom, narrowedByConfig };
}
function normalizeSourcePath(p) {
  const m = /[/\\]PackagesLocalDirectory[/\\](.+)$/.exec(p);
  return m ? m[1].replace(/\\/g, "/") : p;
}
function sourcePathReplacer(key, value) {
  return key === "sourcePath" && typeof value === "string" ? normalizeSourcePath(value) : value;
}
var writtenByModel = /* @__PURE__ */ new Map();
async function writeMetadataJson(outputFile, data, isCustom, modelName) {
  await fs7.writeFile(outputFile, JSON.stringify(data, isCustom ? sourcePathReplacer : void 0, 2));
  let written = writtenByModel.get(modelName);
  if (!written) {
    written = /* @__PURE__ */ new Set();
    writtenByModel.set(modelName, written);
  }
  written.add(path4.resolve(outputFile));
}
async function pruneOrphanedMetadata(outputPath, modelName, written) {
  const modelDir = path4.join(outputPath, modelName);
  const removed = [];
  const sweep = async (dir) => {
    let entries;
    try {
      entries = await fs7.readdir(dir, { withFileTypes: true });
    } catch {
      return false;
    }
    let keptAnything = false;
    for (const entry of entries) {
      const full = path4.join(dir, entry.name);
      if (entry.isDirectory()) {
        const keptBelow = await sweep(full);
        if (keptBelow) {
          keptAnything = true;
        } else {
          await fs7.rmdir(full).catch(() => {
            keptAnything = true;
          });
        }
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        keptAnything = true;
        continue;
      }
      if (written.has(path4.resolve(full))) {
        keptAnything = true;
        continue;
      }
      try {
        await fs7.unlink(full);
        removed.push(path4.relative(modelDir, full).replace(/\\/g, "/"));
      } catch {
        keptAnything = true;
      }
    }
    return keptAnything;
  };
  await sweep(modelDir);
  return removed;
}
var MODELS_TO_EXTRACT = [];
var FILTER_MODE = "all";
if (EXTRACT_MODE === "custom") {
  if (CUSTOM_MODELS.length > 0) {
    const hasWildcards = CUSTOM_MODELS.some((pattern) => pattern.includes("*"));
    if (hasWildcards) {
      FILTER_MODE = "custom-only";
    } else {
      MODELS_TO_EXTRACT = CUSTOM_MODELS;
    }
  } else {
    FILTER_MODE = "custom-only";
  }
} else if (EXTRACT_MODE === "standard") {
  FILTER_MODE = "standard-only";
} else {
  FILTER_MODE = "all";
}
function formatDuration(ms) {
  if (ms < 1e3) return `${formatCount(ms)}ms`;
  if (ms < 6e4) return `${formatDecimal(ms / 1e3)}s`;
  const minutes = Math.floor(ms / 6e4);
  const seconds = ms % 6e4 / 1e3;
  return `${formatCount(minutes)}m ${formatDecimal(seconds)}s`;
}
function formatCount(value) {
  return Math.round(value).toLocaleString("en-US");
}
function formatDecimal(value) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}
function formatPercent(current, total) {
  if (total <= 0) return "0.00%";
  return `${formatDecimal(current / total * 100)}%`;
}
function parsePositiveIntEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = Math.floor(parsed);
  return normalized > 0 ? normalized : fallback;
}
function parsePositiveFloatEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function hostParallelism() {
  try {
    return typeof os.availableParallelism === "function" ? os.availableParallelism() : os.cpus().length;
  } catch {
    return 4;
  }
}
var DEFAULT_FILE_CONCURRENCY = Math.max(2, Math.min(24, hostParallelism()));
var FILE_CONCURRENCY = parsePositiveIntEnv("EXTRACT_FILE_CONCURRENCY", DEFAULT_FILE_CONCURRENCY);
var MAX_FILE_CONCURRENCY = parsePositiveIntEnv("EXTRACT_FILE_CONCURRENCY_MAX", Math.max(FILE_CONCURRENCY, 24));
var HEAVY_MULTIPLIER = parsePositiveFloatEnv("EXTRACT_HEAVY_MULTIPLIER", 1);
var LIGHT_MULTIPLIER = parsePositiveFloatEnv("EXTRACT_LIGHT_MULTIPLIER", 1.25);
function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
function getAdaptiveConcurrency(fileCount, profile) {
  if (fileCount <= 0) return 1;
  let concurrency = FILE_CONCURRENCY;
  if (fileCount >= 5e3) {
    concurrency = Math.floor(concurrency * 0.55);
  } else if (fileCount >= 2500) {
    concurrency = Math.floor(concurrency * 0.7);
  } else if (fileCount >= 1e3) {
    concurrency = Math.floor(concurrency * 0.85);
  } else if (fileCount <= 200) {
    concurrency = Math.ceil(concurrency * 1.15);
  }
  const multiplier = profile === "light" ? LIGHT_MULTIPLIER : HEAVY_MULTIPLIER;
  concurrency = Math.floor(concurrency * multiplier);
  return clamp(concurrency, 1, Math.min(MAX_FILE_CONCURRENCY, fileCount));
}
async function forEachWithConcurrency(items, concurrency, worker) {
  if (items.length === 0) return;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async (_unused, workerIndex) => {
    for (let i = workerIndex; i < items.length; i += concurrency) {
      await worker(items[i]);
    }
  });
  await Promise.all(workers);
}
var AOT_EXTRACTORS = [
  { dirs: ["AxClass"], run: (c2, [dir]) => extractClasses(c2.parser, dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxTable"], run: (c2, [dir]) => extractTables(c2.parser, dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxForm"], run: (c2, [dir]) => extractForms(c2.parser, dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxQuery"], run: (c2, [dir]) => extractQueries(dir, c2.modelName, c2.stats, c2.isCustom) },
  // One extractor for both: parseViewFile tells a view from a data entity by content.
  { dirs: ["AxView", "AxDataEntityView"], run: (c2, dirs) => extractViews(c2.parser, dirs, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxEnum"], run: (c2, [dir]) => extractEnums(dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxEdt"], run: (c2, [dir]) => extractEdts(c2.parser, dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxReport"], run: (c2, [dir]) => extractReports(dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxSecurityPrivilege"], run: (c2, [dir]) => extractSecurityPrivileges(c2.parser, dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxSecurityDuty"], run: (c2, [dir]) => extractSecurityDuties(c2.parser, dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxSecurityRole"], run: (c2, [dir]) => extractSecurityRoles(c2.parser, dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxMenuItemDisplay"], run: (c2, [dir]) => extractMenuItems(c2.parser, dir, c2.modelName, "display", c2.stats, c2.isCustom) },
  { dirs: ["AxMenuItemAction"], run: (c2, [dir]) => extractMenuItems(c2.parser, dir, c2.modelName, "action", c2.stats, c2.isCustom) },
  { dirs: ["AxMenuItemOutput"], run: (c2, [dir]) => extractMenuItems(c2.parser, dir, c2.modelName, "output", c2.stats, c2.isCustom) },
  { dirs: ["AxTableExtension"], run: (c2, [dir]) => extractExtensions(c2.parser, dir, c2.modelName, "table-extension", c2.stats, c2.isCustom) },
  { dirs: ["AxFormExtension"], run: (c2, [dir]) => extractExtensions(c2.parser, dir, c2.modelName, "form-extension", c2.stats, c2.isCustom) },
  { dirs: ["AxEnumExtension"], run: (c2, [dir]) => extractExtensions(c2.parser, dir, c2.modelName, "enum-extension", c2.stats, c2.isCustom) },
  { dirs: ["AxEdtExtension"], run: (c2, [dir]) => extractExtensions(c2.parser, dir, c2.modelName, "edt-extension", c2.stats, c2.isCustom) },
  { dirs: ["AxDataEntityViewExtension"], run: (c2, [dir]) => extractExtensions(c2.parser, dir, c2.modelName, "data-entity-extension", c2.stats, c2.isCustom) },
  { dirs: ["AxViewExtension"], run: (c2, [dir]) => extractExtensions(c2.parser, dir, c2.modelName, "view-extension", c2.stats, c2.isCustom) },
  { dirs: ["AxQuerySimpleExtension"], run: (c2, [dir]) => extractExtensions(c2.parser, dir, c2.modelName, "query-extension", c2.stats, c2.isCustom) },
  { dirs: ["AxMenuExtension"], run: (c2, [dir]) => extractExtensions(c2.parser, dir, c2.modelName, "menu-extension", c2.stats, c2.isCustom) },
  { dirs: ["AxSecurityDutyExtension"], run: (c2, [dir]) => extractExtensions(c2.parser, dir, c2.modelName, "security-duty-extension", c2.stats, c2.isCustom) },
  { dirs: ["AxSecurityRoleExtension"], run: (c2, [dir]) => extractExtensions(c2.parser, dir, c2.modelName, "security-role-extension", c2.stats, c2.isCustom) },
  { dirs: ["AxMenuItemDisplayExtension"], run: (c2, [dir]) => extractExtensions(c2.parser, dir, c2.modelName, "menu-item-display-extension", c2.stats, c2.isCustom) },
  { dirs: ["AxMenuItemActionExtension"], run: (c2, [dir]) => extractExtensions(c2.parser, dir, c2.modelName, "menu-item-action-extension", c2.stats, c2.isCustom) },
  { dirs: ["AxMenuItemOutputExtension"], run: (c2, [dir]) => extractExtensions(c2.parser, dir, c2.modelName, "menu-item-output-extension", c2.stats, c2.isCustom) },
  { dirs: ["AxMapExtension"], run: (c2, [dir]) => extractExtensions(c2.parser, dir, c2.modelName, "map-extension", c2.stats, c2.isCustom) },
  { dirs: ["AxService"], run: (c2, [dir]) => extractServices(c2.parser, dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxServiceGroup"], run: (c2, [dir]) => extractServiceGroups(c2.parser, dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxMap"], run: (c2, [dir]) => extractMaps(c2.parser, dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxConfigurationKey"], run: (c2, [dir]) => extractConfigurationKeys(c2.parser, dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxLicenseCode"], run: (c2, [dir]) => extractLicenseCodes(c2.parser, dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxSecurityPolicy"], run: (c2, [dir]) => extractSecurityPolicies(c2.parser, dir, c2.modelName, c2.stats, c2.isCustom) },
  { dirs: ["AxMacroDictionary"], run: (c2, [dir]) => extractMacros(c2.parser, dir, c2.modelName, c2.stats, c2.isCustom) }
];
var EXTRACTED_AOT_DIRS = AOT_EXTRACTORS.flatMap((e) => e.dirs);
var MODEL_MARKER_DIRS = ["AxClass", "AxTable", "AxEnum", "AxEdt", "AxView", "AxDataEntityView"];
async function mapModelDirs(modelPath) {
  const byLowerName = /* @__PURE__ */ new Map();
  try {
    for (const entry of await fs7.readdir(modelPath, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        byLowerName.set(entry.name.toLowerCase(), path4.join(modelPath, entry.name));
      }
    }
  } catch {
  }
  return byLowerName;
}
function resolveDirs(dirsByLowerName, canonicalDirs) {
  return canonicalDirs.map((dirName) => dirsByLowerName.get(dirName.toLowerCase())).filter((dirPath) => dirPath !== void 0);
}
async function countXmlFilesInDirectory(dirPath) {
  const files = await fs7.readdir(dirPath);
  return files.filter((file) => file.endsWith(".xml")).length;
}
async function countModelXmlFiles(dirsByLowerName) {
  const totals = await Promise.all(
    resolveDirs(dirsByLowerName, EXTRACTED_AOT_DIRS).map((dirPath) => countXmlFilesInDirectory(dirPath))
  );
  return totals.reduce((sum, count) => sum + count, 0);
}
async function extractMetadata() {
  const extractionStart = Date.now();
  const W = 56;
  console.log("");
  for (const line of box([
    spread(c.bold("D365 F&O Metadata Extraction"), c.dim(`mode=${EXTRACT_MODE}`), W),
    c.gray("XML metadata -> JSON")
  ], W)) {
    console.log(line);
  }
  console.log("");
  const metadataRoots = [];
  let customRoot = null;
  const devEnvType = process.env.DEV_ENVIRONMENT_TYPE || "auto";
  if (devEnvType !== "traditional") {
    const xppProvider = new XppConfigProvider();
    const configName = process.env.XPP_CONFIG_NAME || void 0;
    const xppConfig = await xppProvider.getActiveConfig(configName);
    if (xppConfig) {
      log.info(`UDE config: ${xppConfig.configName} v${xppConfig.version}`);
      customRoot = xppConfig.customPackagesPath;
      metadataRoots.push(xppConfig.customPackagesPath);
      log.detail(`Custom packages: ${shortPath(xppConfig.customPackagesPath)}`);
      metadataRoots.push(xppConfig.microsoftPackagesPath);
      log.detail(`Microsoft packages: ${shortPath(xppConfig.microsoftPackagesPath)}`);
    }
  }
  if (metadataRoots.length === 0) {
    metadataRoots.push(PACKAGES_PATH);
  }
  console.log(kv("Source", metadataRoots.join(", ")));
  console.log(kv("Output", shortPath(OUTPUT_PATH)));
  console.log(kv("File workers", formatCount(FILE_CONCURRENCY)));
  console.log(kv("File workers max", formatCount(MAX_FILE_CONCURRENCY)));
  console.log(kv("Heavy multiplier", formatDecimal(HEAVY_MULTIPLIER)));
  console.log(kv("Light multiplier", formatDecimal(LIGHT_MULTIPLIER)));
  if (EXTRACT_MODE === "custom") {
    if (MODELS_TO_EXTRACT.length > 0) {
      log.detail(`Custom models (explicit): ${MODELS_TO_EXTRACT.join(", ")}`);
    } else {
      log.detail("Extracting custom models only");
      if (CUSTOM_MODELS.length > 0) {
        log.detail(`Custom model patterns: ${CUSTOM_MODELS.join(", ")}`);
      }
      const extensionPrefix = process.env.EXTENSION_PREFIX;
      if (extensionPrefix) {
        log.detail(`Extension prefix: ${extensionPrefix}`);
      }
    }
  } else if (EXTRACT_MODE === "standard") {
    log.detail("Extracting standard models (exclude custom)");
    if (CUSTOM_MODELS.length > 0) {
      log.detail(`Custom models to exclude: ${CUSTOM_MODELS.join(", ")}`);
    }
  } else {
    log.detail("Extracting all models (standard + custom)");
  }
  console.log("");
  log.info("AxLabelFile labels (.label.txt) are NOT extracted here.");
  log.detail(`Labels are indexed directly from PACKAGES_PATH during 'npm run build-database'.`);
  console.log("");
  const parser = new XppMetadataParser();
  const stats = {
    totalFiles: 0,
    classes: 0,
    tables: 0,
    forms: 0,
    queries: 0,
    views: 0,
    dataEntities: 0,
    enums: 0,
    edts: 0,
    reports: 0,
    securityPrivileges: 0,
    securityDuties: 0,
    securityRoles: 0,
    menuItemDisplays: 0,
    menuItemActions: 0,
    menuItemOutputs: 0,
    tableExtensions: 0,
    classExtensions: 0,
    formExtensions: 0,
    enumExtensions: 0,
    edtExtensions: 0,
    dataEntityExtensions: 0,
    viewExtensions: 0,
    queryExtensions: 0,
    mapExtensions: 0,
    menuExtensions: 0,
    securityDutyExtensions: 0,
    securityRoleExtensions: 0,
    menuItemDisplayExtensions: 0,
    menuItemActionExtensions: 0,
    menuItemOutputExtensions: 0,
    services: 0,
    serviceGroups: 0,
    maps: 0,
    configurationKeys: 0,
    licenseCodes: 0,
    securityPolicies: 0,
    macros: 0,
    errors: 0
  };
  if (EXTRACT_MODE === "all") {
    try {
      await fs7.rm(OUTPUT_PATH, { recursive: true, force: true });
      log.step("Cleaned up existing metadata directory");
    } catch {
    }
  } else {
    log.info("Preserving existing metadata (incremental build)");
  }
  await fs7.mkdir(OUTPUT_PATH, { recursive: true });
  async function findActualDirectoryName(basePath, targetName) {
    try {
      const entries = await fs7.readdir(basePath, { withFileTypes: true });
      const found = entries.find(
        (e) => (e.isDirectory() || e.isSymbolicLink()) && e.name.toLowerCase() === targetName.toLowerCase()
      );
      return found ? found.name : null;
    } catch {
      return null;
    }
  }
  const packageRootMap = /* @__PURE__ */ new Map();
  if (MODELS_TO_EXTRACT.length > 0) {
    for (const root of metadataRoots) {
      for (const modelName of MODELS_TO_EXTRACT) {
        const actualName = await findActualDirectoryName(root, modelName);
        if (actualName && !packageRootMap.has(actualName)) {
          packageRootMap.set(actualName, root);
        }
      }
    }
    for (const modelName of MODELS_TO_EXTRACT) {
      const found = [...packageRootMap.keys()].some(
        (pkg) => pkg.toLowerCase() === modelName.toLowerCase()
      );
      if (!found) {
        log.warn(`Model not found: ${modelName}`);
      }
    }
  } else {
    let totalAllPackageNames = 0;
    for (const root of metadataRoots) {
      const allPackages = await fs7.readdir(root, { withFileTypes: true });
      const allPackageNames = allPackages.filter((e) => e.isDirectory() || e.isSymbolicLink()).map((e) => e.name);
      totalAllPackageNames += allPackageNames.length;
      let filteredPackages;
      if (FILTER_MODE === "custom-only") {
        if (customRoot) {
          filteredPackages = root === customRoot ? allPackageNames : [];
        } else {
          filteredPackages = allPackageNames.filter((pkg) => isCustomModel2(pkg));
        }
      } else if (FILTER_MODE === "standard-only") {
        if (customRoot) {
          filteredPackages = root === customRoot ? [] : allPackageNames;
        } else {
          filteredPackages = allPackageNames.filter((pkg) => !isCustomModel2(pkg));
        }
      } else {
        filteredPackages = allPackageNames;
      }
      for (const pkg of filteredPackages) {
        if (!packageRootMap.has(pkg)) {
          packageRootMap.set(pkg, root);
        }
      }
    }
    const packagesToProcessCount = packageRootMap.size;
    if (FILTER_MODE === "custom-only") {
      log.step(`Found ${formatCount(packagesToProcessCount)} custom packages to process (${formatCount(totalAllPackageNames - packagesToProcessCount)} standard models excluded)`);
    } else if (FILTER_MODE === "standard-only") {
      log.step(`Found ${formatCount(packagesToProcessCount)} standard packages to process (${formatCount(totalAllPackageNames - packagesToProcessCount)} custom models excluded)`);
    } else {
      log.step(`Found ${formatCount(packagesToProcessCount)} packages to process`);
    }
  }
  const modelWorkItems = [];
  for (const [packageName, rootPath] of packageRootMap) {
    const packagePath = path4.join(rootPath, packageName);
    try {
      await fs7.access(packagePath);
    } catch {
      log.warn(`Package path not found: ${packagePath}`);
      continue;
    }
    const entries = await fs7.readdir(packagePath, { withFileTypes: true });
    const modelDirs = entries.filter((e) => e.isDirectory() || e.isSymbolicLink()).map((e) => e.name);
    for (const modelName of modelDirs) {
      const modelPath = path4.join(packagePath, modelName);
      const modelDirsByLowerName = await mapModelDirs(modelPath);
      if (resolveDirs(modelDirsByLowerName, MODEL_MARKER_DIRS).length === 0) {
        continue;
      }
      if (modelName.endsWith("FormAdaptor")) {
        log.detail(`${glyph.arrow} skip FormAdaptor model: ${modelName}`);
        continue;
      }
      const { isCustom, narrowedByConfig } = classifyCustom(rootPath, customRoot, modelName);
      if (FILTER_MODE === "custom-only" && !isCustom) {
        log.detail(`${glyph.arrow} skip standard model: ${modelName}`);
        continue;
      }
      if (FILTER_MODE === "custom-only" && narrowedByConfig) {
        log.detail(`${glyph.arrow} skip model outside CUSTOM_MODELS patterns: ${modelName}`);
        continue;
      }
      if (FILTER_MODE === "standard-only" && isCustom) {
        log.detail(`${glyph.arrow} skip custom model: ${modelName}`);
        continue;
      }
      const expectedXmlFiles = await countModelXmlFiles(modelDirsByLowerName);
      modelWorkItems.push({ packageName, modelName, modelPath, expectedXmlFiles, isCustom });
    }
  }
  const totalModels = modelWorkItems.length;
  const totalExpectedFiles = modelWorkItems.reduce((sum, item) => sum + item.expectedXmlFiles, 0);
  console.log("");
  log.step(`Planned work: ${formatCount(totalModels)} models, ${formatCount(totalExpectedFiles)} XML files`);
  let currentPackage = "";
  let processedModels = 0;
  let cumulativeModelDuration = 0;
  const shouldPrune = EXTRACT_MODE !== "all";
  let prunedFiles = 0;
  const prunedByModel = /* @__PURE__ */ new Map();
  const pruneSkippedModels = [];
  for (const modelItem of modelWorkItems) {
    if (currentPackage !== modelItem.packageName) {
      currentPackage = modelItem.packageName;
      console.log("");
      log.step(`${c.bold(currentPackage)} ${c.dim(glyph.dot)} model progress ${formatPercent(processedModels, totalModels)} (${formatCount(processedModels)}/${formatCount(totalModels)})`);
    }
    const modelStart = Date.now();
    log.detail(`${modelItem.modelName} (${formatCount(modelItem.expectedXmlFiles)} XML files)`);
    const { modelPath, modelName, isCustom } = modelItem;
    const ctx = { parser, modelName, stats, isCustom };
    const dirsByLowerName = await mapModelDirs(modelPath);
    const errorsBefore = stats.errors;
    for (const extractor of AOT_EXTRACTORS) {
      const dirPaths = resolveDirs(dirsByLowerName, extractor.dirs);
      if (dirPaths.length === 0) continue;
      await extractor.run(ctx, dirPaths);
    }
    const wroteNothing = (writtenByModel.get(modelName)?.size ?? 0) === 0;
    if (shouldPrune) {
      if (stats.errors > errorsBefore || wroteNothing && modelItem.expectedXmlFiles > 0) {
        pruneSkippedModels.push(modelName);
      } else {
        const removed = await pruneOrphanedMetadata(
          OUTPUT_PATH,
          modelName,
          writtenByModel.get(modelName) ?? /* @__PURE__ */ new Set()
        );
        if (removed.length > 0) {
          prunedFiles += removed.length;
          prunedByModel.set(modelName, removed);
          log.detail(`pruned ${formatCount(removed.length)} orphaned JSON file(s): ${removed.slice(0, 5).join(", ")}${removed.length > 5 ? ` (+${removed.length - 5} more)` : ""}`);
        }
      }
    }
    const modelDuration = Date.now() - modelStart;
    cumulativeModelDuration += modelDuration;
    processedModels++;
    const elapsed = Date.now() - extractionStart;
    const avgModelDuration = processedModels > 0 ? cumulativeModelDuration / processedModels : 0;
    const avgFileDuration = stats.totalFiles > 0 ? elapsed / stats.totalFiles : 0;
    log.detail(
      `done in ${formatDuration(modelDuration)} ${glyph.dot} progress ${formatPercent(processedModels, totalModels)} (${formatCount(processedModels)}/${formatCount(totalModels)} models), ${formatPercent(stats.totalFiles, totalExpectedFiles)} (${formatCount(stats.totalFiles)}/${formatCount(totalExpectedFiles)} files) ${glyph.dot} avg ${formatDuration(avgModelDuration)}/model, ${formatDuration(avgFileDuration)}/file`
    );
  }
  const detectedCustomModels = [
    ...new Set(modelWorkItems.filter((i) => i.isCustom).map((i) => i.modelName))
  ];
  try {
    writeExtractManifest(OUTPUT_PATH, {
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      extractMode: EXTRACT_MODE,
      environment: customRoot ? "ude" : "traditional",
      customModels: detectedCustomModels
    });
    log.detail(`Wrote extract manifest (${detectedCustomModels.length} custom model(s) recorded)`);
  } catch (error) {
    log.warn(`Could not write extract manifest (non-fatal): ${error instanceof Error ? error.message : error}`);
  }
  const totalDuration = Date.now() - extractionStart;
  const averagePerFile = stats.totalFiles > 0 ? totalDuration / stats.totalFiles : 0;
  const averagePerModel = processedModels > 0 ? cumulativeModelDuration / processedModels : 0;
  console.log("");
  console.log(statusLine("ok", c.green(`Extraction complete in ${formatDuration(totalDuration)}`)));
  log.detail(`avg ${formatDuration(averagePerModel)}/model, ${formatDuration(averagePerFile)}/file`);
  console.log("");
  console.log(sectionTitle(`Statistics (${formatCount(stats.totalFiles)} files)`));
  console.log("");
  const statRows = [
    ["Classes", stats.classes],
    ["Tables", stats.tables],
    ["Forms", stats.forms],
    ["Queries", stats.queries],
    ["Views", stats.views],
    ["Data entities", stats.dataEntities],
    ["Enums", stats.enums],
    ["EDTs", stats.edts],
    ["Reports", stats.reports],
    ["Security privileges", stats.securityPrivileges],
    ["Security duties", stats.securityDuties],
    ["Security roles", stats.securityRoles],
    ["Menu items (display)", stats.menuItemDisplays],
    ["Menu items (action)", stats.menuItemActions],
    ["Menu items (output)", stats.menuItemOutputs],
    ["Table extensions", stats.tableExtensions],
    ["Class extensions", stats.classExtensions],
    ["Form extensions", stats.formExtensions],
    ["Enum extensions", stats.enumExtensions],
    ["EDT extensions", stats.edtExtensions],
    ["Data entity extensions", stats.dataEntityExtensions],
    ["View extensions", stats.viewExtensions],
    ["Query extensions", stats.queryExtensions],
    ["Map extensions", stats.mapExtensions],
    ["Menu extensions", stats.menuExtensions],
    ["Security duty extensions", stats.securityDutyExtensions],
    ["Security role extensions", stats.securityRoleExtensions],
    ["Menu item extensions (display)", stats.menuItemDisplayExtensions],
    ["Menu item extensions (action)", stats.menuItemActionExtensions],
    ["Menu item extensions (output)", stats.menuItemOutputExtensions],
    ["Services", stats.services],
    ["Service groups", stats.serviceGroups],
    ["Maps", stats.maps],
    ["Configuration keys", stats.configurationKeys],
    ["License codes", stats.licenseCodes],
    ["Security policies", stats.securityPolicies],
    ["Macros", stats.macros]
  ];
  const statLabelWidth = Math.max(...statRows.map(([label]) => label.length)) + 2;
  for (const [label, value] of statRows) {
    if (value === 0) continue;
    console.log(kv(label, c.cyan(formatCount(value)), statLabelWidth));
  }
  if (shouldPrune) {
    console.log("");
    if (prunedFiles > 0) {
      console.log(statusLine("ok", `Pruned ${formatCount(prunedFiles)} orphaned JSON file(s) across ${formatCount(prunedByModel.size)} model(s)`));
      for (const [modelName, removed] of prunedByModel) {
        log.detail(`${modelName}: ${removed.slice(0, 10).join(", ")}${removed.length > 10 ? ` (+${removed.length - 10} more)` : ""}`);
      }
      log.detail("These objects are gone from PackagesLocalDirectory. Run build-database to drop them from the symbol index.");
      const blobMarker = readBlobDownloadMarker(OUTPUT_PATH);
      if (blobMarker) {
        const overlap = [...prunedByModel.keys()].filter(
          (m) => blobMarker.models.length === 0 || blobMarker.models.includes(m)
        );
        if (overlap.length > 0) {
          console.log(statusLine("warn", c.yellow(
            `${formatCount(overlap.length)} of these model(s) also hold metadata downloaded from blob storage on ${blobMarker.downloadedAt} (${blobMarker.modelType}): ${overlap.slice(0, 10).join(", ")}${overlap.length > 10 ? ` (+${overlap.length - 10} more)` : ""}`
          )));
          log.detail(
            "Local disk is authoritative for a model this run re-extracted, so JSON the blob copy had and this machine's PackagesLocalDirectory does not was removed as an orphan. That is the intended precedence, not a bug \u2014 but if this machine holds only part of the AOT, re-run the blob download afterwards or exclude those models from extraction."
          );
        }
      }
    } else {
      log.info("No orphaned metadata found - every extracted JSON has a live source file");
    }
    if (pruneSkippedModels.length > 0) {
      console.log(statusLine("warn", c.yellow(`Orphan sweep skipped for ${formatCount(pruneSkippedModels.length)} model(s) with extraction errors: ${pruneSkippedModels.slice(0, 10).join(", ")}`)));
      log.detail("A parse failure writes no JSON, which is indistinguishable from a deleted object - fix the errors and re-run, or those models may still serve stale metadata.");
    }
  }
  console.log("");
  if (stats.errors > 0) {
    console.log(statusLine("warn", c.yellow(`${formatCount(stats.errors)} error(s) during extraction - see log above`)));
  } else {
    console.log(statusLine("ok", "No errors"));
  }
  console.log("");
}
async function extractClasses(parser, classesPath, modelName, stats, isCustom = false) {
  const files = await fs7.readdir(classesPath);
  const xmlFiles = files.filter((f) => f.endsWith(".xml"));
  const fileConcurrency = getAdaptiveConcurrency(xmlFiles.length, "heavy");
  log.detail(`Classes: ${formatCount(xmlFiles.length)} files (${formatCount(fileConcurrency)} workers)`);
  await forEachWithConcurrency(xmlFiles, fileConcurrency, async (file) => {
    const filePath = path4.join(classesPath, file);
    stats.totalFiles++;
    try {
      const classInfo = await parser.parseClassFile(filePath, modelName);
      if (!classInfo.success || !classInfo.data) {
        log.warn(`Failed to parse ${file}: ${classInfo.error || "Unknown error"}`);
        stats.errors++;
        return;
      }
      const classData = classInfo.data;
      const outputDir = path4.join(OUTPUT_PATH, modelName, "classes");
      await fs7.mkdir(outputDir, { recursive: true });
      const outputFile = path4.join(outputDir, `${classData.name}.json`);
      await writeMetadataJson(outputFile, classData, isCustom, modelName);
      stats.classes++;
      if (classData.extensionOf) {
        await writeClassExtensionRecord(classData, modelName, stats, isCustom);
      }
    } catch (error) {
      log.err(`Error parsing ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function writeClassExtensionRecord(classInfo, modelName, stats, isCustom) {
  const record = buildClassExtensionRecord(classInfo, modelName);
  if (!record) return;
  const outputDir = path4.join(OUTPUT_PATH, modelName, "class-extensions");
  await fs7.mkdir(outputDir, { recursive: true });
  await writeMetadataJson(
    path4.join(outputDir, `${classInfo.name}.json`),
    record,
    isCustom,
    modelName
  );
  stats.classExtensions++;
}
async function extractTables(parser, tablesPath, modelName, stats, isCustom = false) {
  const files = await fs7.readdir(tablesPath);
  const xmlFiles = files.filter((f) => f.endsWith(".xml"));
  const fileConcurrency = getAdaptiveConcurrency(xmlFiles.length, "heavy");
  log.detail(`Tables: ${formatCount(xmlFiles.length)} files (${formatCount(fileConcurrency)} workers)`);
  await forEachWithConcurrency(xmlFiles, fileConcurrency, async (file) => {
    const filePath = path4.join(tablesPath, file);
    stats.totalFiles++;
    try {
      const tableInfo = await parser.parseTableFile(filePath, modelName);
      if (!tableInfo.success || !tableInfo.data) {
        log.warn(`Failed to parse ${file}: ${tableInfo.error || "Unknown error"}`);
        stats.errors++;
        return;
      }
      const tableData = tableInfo.data;
      const outputDir = path4.join(OUTPUT_PATH, modelName, "tables");
      await fs7.mkdir(outputDir, { recursive: true });
      const outputFile = path4.join(outputDir, `${tableData.name}.json`);
      await writeMetadataJson(outputFile, tableData, isCustom, modelName);
      stats.tables++;
    } catch (error) {
      log.err(`Error parsing ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function extractForms(parser, formsPath, modelName, stats, isCustom = false) {
  const files = await fs7.readdir(formsPath);
  const xmlFiles = files.filter((f) => f.endsWith(".xml"));
  const fileConcurrency = getAdaptiveConcurrency(xmlFiles.length, "heavy");
  log.detail(`Forms: ${formatCount(xmlFiles.length)} files (${formatCount(fileConcurrency)} workers)`);
  await forEachWithConcurrency(xmlFiles, fileConcurrency, async (file) => {
    const filePath = path4.join(formsPath, file);
    stats.totalFiles++;
    try {
      const result = await parser.parseFormFile(filePath, modelName);
      if (!result.success || !result.data) {
        log.err(`Error parsing ${file}: ${result.error || "Unknown error"}`);
        stats.errors++;
        return;
      }
      const formInfo = result.data;
      const outputDir = path4.join(OUTPUT_PATH, modelName, "forms");
      await fs7.mkdir(outputDir, { recursive: true });
      const outputFile = path4.join(outputDir, `${formInfo.name}.json`);
      await writeMetadataJson(outputFile, formInfo, isCustom, modelName);
      stats.forms++;
    } catch (error) {
      log.err(`Error parsing ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function extractQueries(queriesPath, modelName, stats, isCustom = false) {
  const files = await fs7.readdir(queriesPath);
  const xmlFiles = files.filter((f) => f.endsWith(".xml"));
  const fileConcurrency = getAdaptiveConcurrency(xmlFiles.length, "light");
  log.detail(`Queries: ${formatCount(xmlFiles.length)} files (${formatCount(fileConcurrency)} workers)`);
  await forEachWithConcurrency(xmlFiles, fileConcurrency, async (file) => {
    const filePath = path4.join(queriesPath, file);
    stats.totalFiles++;
    try {
      const queryName = path4.basename(file, ".xml");
      const queryInfo = {
        name: queryName,
        model: modelName,
        sourcePath: filePath,
        type: "query"
      };
      const outputDir = path4.join(OUTPUT_PATH, modelName, "queries");
      await fs7.mkdir(outputDir, { recursive: true });
      const outputFile = path4.join(outputDir, `${queryName}.json`);
      await writeMetadataJson(outputFile, queryInfo, isCustom, modelName);
      stats.queries++;
    } catch (error) {
      log.err(`Error parsing ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function extractViews(parser, sourceDirs, modelName, stats, isCustom = false) {
  let totalXmlFiles = 0;
  for (const sourceDir of sourceDirs) {
    const files = await fs7.readdir(sourceDir);
    const xmlFiles = files.filter((f) => f.endsWith(".xml"));
    const fileConcurrency = getAdaptiveConcurrency(xmlFiles.length, "heavy");
    totalXmlFiles += xmlFiles.length;
    await forEachWithConcurrency(xmlFiles, fileConcurrency, async (file) => {
      const filePath = path4.join(sourceDir, file);
      stats.totalFiles++;
      try {
        const viewInfo = await parser.parseViewFile(filePath, modelName);
        if (!viewInfo.success || !viewInfo.data) {
          log.warn(`Failed to parse ${file}: ${viewInfo.error || "Unknown error"}`);
          stats.errors++;
          return;
        }
        const viewData = viewInfo.data;
        const outputDir = path4.join(OUTPUT_PATH, modelName, "views");
        await fs7.mkdir(outputDir, { recursive: true });
        const outputFile = path4.join(outputDir, `${viewData.name}.json`);
        await writeMetadataJson(outputFile, viewData, isCustom, modelName);
        if (viewData.type === "data-entity") {
          stats.dataEntities++;
        } else {
          stats.views++;
        }
      } catch (error) {
        log.err(`Error parsing ${file}: ${error instanceof Error ? error.message : error}`);
        stats.errors++;
      }
    });
  }
  log.detail(`Views/Data entities: ${formatCount(totalXmlFiles)} files`);
}
async function extractEnums(enumsPath, modelName, stats, isCustom = false) {
  const files = await fs7.readdir(enumsPath);
  const xmlFiles = files.filter((f) => f.endsWith(".xml"));
  const fileConcurrency = getAdaptiveConcurrency(xmlFiles.length, "light");
  log.detail(`Enums: ${formatCount(xmlFiles.length)} files (${formatCount(fileConcurrency)} workers)`);
  await forEachWithConcurrency(xmlFiles, fileConcurrency, async (file) => {
    const filePath = path4.join(enumsPath, file);
    stats.totalFiles++;
    try {
      const content = await fs7.readFile(filePath, "utf-8");
      const outputDir = path4.join(OUTPUT_PATH, modelName, "enums");
      await fs7.mkdir(outputDir, { recursive: true });
      const outputFile = path4.join(outputDir, file.replace(".xml", ".json"));
      await writeMetadataJson(outputFile, { raw: content, sourcePath: filePath }, isCustom, modelName);
      stats.enums++;
    } catch (error) {
      log.err(`Error parsing ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function extractEdts(parser, edtsPath, modelName, stats, isCustom = false) {
  const files = await fs7.readdir(edtsPath);
  const xmlFiles = files.filter((f) => f.endsWith(".xml"));
  const fileConcurrency = getAdaptiveConcurrency(xmlFiles.length, "heavy");
  log.detail(`EDTs: ${formatCount(xmlFiles.length)} files (${formatCount(fileConcurrency)} workers)`);
  await forEachWithConcurrency(xmlFiles, fileConcurrency, async (file) => {
    const filePath = path4.join(edtsPath, file);
    stats.totalFiles++;
    try {
      const result = await parser.parseEdtFile(filePath, modelName);
      if (!result.success || !result.data) {
        log.err(`Error parsing ${file}: ${result.error || "Unknown error"}`);
        stats.errors++;
        return;
      }
      const edtInfo = result.data;
      const outputDir = path4.join(OUTPUT_PATH, modelName, "edts");
      await fs7.mkdir(outputDir, { recursive: true });
      const outputFile = path4.join(outputDir, `${edtInfo.name}.json`);
      await writeMetadataJson(outputFile, edtInfo, isCustom, modelName);
      stats.edts++;
    } catch (error) {
      log.err(`Error parsing ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function extractReports(reportsPath, modelName, stats, isCustom = false) {
  const files = await fs7.readdir(reportsPath);
  const xmlFiles = files.filter((f) => f.endsWith(".xml"));
  if (xmlFiles.length === 0) return;
  const fileConcurrency = getAdaptiveConcurrency(xmlFiles.length, "light");
  log.detail(`Reports: ${formatCount(xmlFiles.length)} files (${formatCount(fileConcurrency)} workers)`);
  const outputDir = path4.join(OUTPUT_PATH, modelName, "reports");
  await fs7.mkdir(outputDir, { recursive: true });
  await forEachWithConcurrency(xmlFiles, fileConcurrency, async (file) => {
    const filePath = path4.join(reportsPath, file);
    stats.totalFiles++;
    try {
      const name = file.replace(".xml", "");
      const stub = {
        name,
        type: "report",
        model: modelName,
        // sourcePath lets reportInfo.ts read the live XML via the JSON metadata wrapper
        sourcePath: filePath
      };
      const outputFile = path4.join(outputDir, `${name}.json`);
      await writeMetadataJson(outputFile, stub, isCustom, modelName);
      stats.reports++;
    } catch (error) {
      log.err(`Error extracting report ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function extractSecurityPrivileges(parser, dirPath, modelName, stats, isCustom = false) {
  const files = (await fs7.readdir(dirPath)).filter((f) => f.endsWith(".xml"));
  if (files.length === 0) return;
  const fileConcurrency = getAdaptiveConcurrency(files.length, "heavy");
  log.detail(`Security privileges: ${formatCount(files.length)} files (${formatCount(fileConcurrency)} workers)`);
  const outputDir = path4.join(OUTPUT_PATH, modelName, "security-privileges");
  await fs7.mkdir(outputDir, { recursive: true });
  await forEachWithConcurrency(files, fileConcurrency, async (file) => {
    const filePath = path4.join(dirPath, file);
    stats.totalFiles++;
    try {
      const result = await parser.parseSecurityPrivilegeFile(filePath);
      if (!result.success || !result.data) {
        stats.errors++;
        return;
      }
      const privilegeData = result.data;
      const outputFile = path4.join(outputDir, `${privilegeData.name}.json`);
      await writeMetadataJson(outputFile, { ...privilegeData, model: modelName, type: "security-privilege" }, isCustom, modelName);
      stats.securityPrivileges++;
    } catch (error) {
      log.err(`Error extracting security privilege ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function extractSecurityDuties(parser, dirPath, modelName, stats, isCustom = false) {
  const files = (await fs7.readdir(dirPath)).filter((f) => f.endsWith(".xml"));
  if (files.length === 0) return;
  const fileConcurrency = getAdaptiveConcurrency(files.length, "heavy");
  log.detail(`Security duties: ${formatCount(files.length)} files (${formatCount(fileConcurrency)} workers)`);
  const outputDir = path4.join(OUTPUT_PATH, modelName, "security-duties");
  await fs7.mkdir(outputDir, { recursive: true });
  await forEachWithConcurrency(files, fileConcurrency, async (file) => {
    const filePath = path4.join(dirPath, file);
    stats.totalFiles++;
    try {
      const result = await parser.parseSecurityDutyFile(filePath);
      if (!result.success || !result.data) {
        stats.errors++;
        return;
      }
      const dutyData = result.data;
      const outputFile = path4.join(outputDir, `${dutyData.name}.json`);
      await writeMetadataJson(outputFile, { ...dutyData, model: modelName, type: "security-duty" }, isCustom, modelName);
      stats.securityDuties++;
    } catch (error) {
      log.err(`Error extracting security duty ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function extractSecurityRoles(parser, dirPath, modelName, stats, isCustom = false) {
  const files = (await fs7.readdir(dirPath)).filter((f) => f.endsWith(".xml"));
  if (files.length === 0) return;
  const fileConcurrency = getAdaptiveConcurrency(files.length, "heavy");
  log.detail(`Security roles: ${formatCount(files.length)} files (${formatCount(fileConcurrency)} workers)`);
  const outputDir = path4.join(OUTPUT_PATH, modelName, "security-roles");
  await fs7.mkdir(outputDir, { recursive: true });
  await forEachWithConcurrency(files, fileConcurrency, async (file) => {
    const filePath = path4.join(dirPath, file);
    stats.totalFiles++;
    try {
      const result = await parser.parseSecurityRoleFile(filePath);
      if (!result.success || !result.data) {
        stats.errors++;
        return;
      }
      const roleData = result.data;
      const outputFile = path4.join(outputDir, `${roleData.name}.json`);
      await writeMetadataJson(outputFile, { ...roleData, model: modelName, type: "security-role" }, isCustom, modelName);
      stats.securityRoles++;
    } catch (error) {
      log.err(`Error extracting security role ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function extractMenuItems(parser, dirPath, modelName, itemType, stats, isCustom = false) {
  const outDirName = `menu-item-${itemType}s`;
  const statKey = itemType === "display" ? "menuItemDisplays" : itemType === "action" ? "menuItemActions" : "menuItemOutputs";
  const files = (await fs7.readdir(dirPath)).filter((f) => f.endsWith(".xml"));
  if (files.length === 0) return;
  const fileConcurrency = getAdaptiveConcurrency(files.length, "heavy");
  log.detail(`Menu items (${itemType}): ${formatCount(files.length)} files (${formatCount(fileConcurrency)} workers)`);
  const outputDir = path4.join(OUTPUT_PATH, modelName, outDirName);
  await fs7.mkdir(outputDir, { recursive: true });
  await forEachWithConcurrency(files, fileConcurrency, async (file) => {
    const filePath = path4.join(dirPath, file);
    stats.totalFiles++;
    try {
      const result = await parser.parseMenuItemFile(filePath, itemType);
      if (!result.success || !result.data) {
        stats.errors++;
        return;
      }
      const menuItemData = result.data;
      const outputFile = path4.join(outputDir, `${menuItemData.name}.json`);
      await writeMetadataJson(outputFile, { ...menuItemData, model: modelName, type: `menu-item-${itemType}` }, isCustom, modelName);
      stats[statKey]++;
    } catch (error) {
      log.err(`Error extracting menu item (${itemType}) ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function extractExtensions(parser, dirPath, modelName, extensionType, stats, isCustom = false) {
  const outDirName = extensionType + "s";
  const statKeyMap = {
    "table-extension": "tableExtensions",
    "class-extension": "classExtensions",
    "form-extension": "formExtensions",
    "enum-extension": "enumExtensions",
    "edt-extension": "edtExtensions",
    "data-entity-extension": "dataEntityExtensions",
    "view-extension": "viewExtensions",
    "query-extension": "queryExtensions",
    "map-extension": "mapExtensions",
    "menu-extension": "menuExtensions",
    "security-duty-extension": "securityDutyExtensions",
    "security-role-extension": "securityRoleExtensions",
    "menu-item-display-extension": "menuItemDisplayExtensions",
    "menu-item-action-extension": "menuItemActionExtensions",
    "menu-item-output-extension": "menuItemOutputExtensions"
  };
  const files = (await fs7.readdir(dirPath)).filter((f) => f.endsWith(".xml"));
  if (files.length === 0) return;
  const fileConcurrency = getAdaptiveConcurrency(files.length, "heavy");
  log.detail(`${extensionType}s: ${formatCount(files.length)} files (${formatCount(fileConcurrency)} workers)`);
  const outputDir = path4.join(OUTPUT_PATH, modelName, outDirName);
  await fs7.mkdir(outputDir, { recursive: true });
  await forEachWithConcurrency(files, fileConcurrency, async (file) => {
    const filePath = path4.join(dirPath, file);
    stats.totalFiles++;
    try {
      const result = await parser.parseExtensionFile(filePath, extensionType);
      if (!result.success || !result.data) {
        stats.errors++;
        return;
      }
      const extensionData = result.data;
      const outputFile = path4.join(outputDir, `${extensionData.name}.json`);
      await writeMetadataJson(outputFile, { ...extensionData, model: modelName, type: extensionType }, isCustom, modelName);
      const statKey = statKeyMap[extensionType];
      if (statKey) stats[statKey]++;
    } catch (error) {
      log.err(`Error extracting ${extensionType} ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function extractServices(parser, dirPath, modelName, stats, isCustom = false) {
  const files = (await fs7.readdir(dirPath)).filter((f) => f.endsWith(".xml"));
  if (files.length === 0) return;
  const fileConcurrency = getAdaptiveConcurrency(files.length, "heavy");
  log.detail(`Services: ${formatCount(files.length)} files (${formatCount(fileConcurrency)} workers)`);
  const outputDir = path4.join(OUTPUT_PATH, modelName, "services");
  await fs7.mkdir(outputDir, { recursive: true });
  await forEachWithConcurrency(files, fileConcurrency, async (file) => {
    const filePath = path4.join(dirPath, file);
    stats.totalFiles++;
    try {
      const result = await parser.parseServiceFile(filePath);
      if (!result.success || !result.data) {
        stats.errors++;
        return;
      }
      const serviceData = result.data;
      const outputFile = path4.join(outputDir, `${serviceData.name}.json`);
      await writeMetadataJson(outputFile, { ...serviceData, model: modelName, type: "service" }, isCustom, modelName);
      stats.services++;
    } catch (error) {
      log.err(`Error extracting service ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function extractServiceGroups(parser, dirPath, modelName, stats, isCustom = false) {
  const files = (await fs7.readdir(dirPath)).filter((f) => f.endsWith(".xml"));
  if (files.length === 0) return;
  const fileConcurrency = getAdaptiveConcurrency(files.length, "heavy");
  log.detail(`Service groups: ${formatCount(files.length)} files (${formatCount(fileConcurrency)} workers)`);
  const outputDir = path4.join(OUTPUT_PATH, modelName, "service-groups");
  await fs7.mkdir(outputDir, { recursive: true });
  await forEachWithConcurrency(files, fileConcurrency, async (file) => {
    const filePath = path4.join(dirPath, file);
    stats.totalFiles++;
    try {
      const result = await parser.parseServiceGroupFile(filePath);
      if (!result.success || !result.data) {
        stats.errors++;
        return;
      }
      const serviceGroupData = result.data;
      const outputFile = path4.join(outputDir, `${serviceGroupData.name}.json`);
      await writeMetadataJson(outputFile, { ...serviceGroupData, model: modelName, type: "service-group" }, isCustom, modelName);
      stats.serviceGroups++;
    } catch (error) {
      log.err(`Error extracting service group ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function extractSimpleType(dirPath, modelName, outDirName, type, statKey, parseFn, stats, isCustom, label) {
  const files = (await fs7.readdir(dirPath)).filter((f) => f.endsWith(".xml"));
  if (files.length === 0) return;
  const fileConcurrency = getAdaptiveConcurrency(files.length, "heavy");
  log.detail(`${label}: ${formatCount(files.length)} files (${formatCount(fileConcurrency)} workers)`);
  const outputDir = path4.join(OUTPUT_PATH, modelName, outDirName);
  await fs7.mkdir(outputDir, { recursive: true });
  await forEachWithConcurrency(files, fileConcurrency, async (file) => {
    const filePath = path4.join(dirPath, file);
    stats.totalFiles++;
    try {
      const result = await parseFn(filePath);
      if (!result.success || !result.data) {
        stats.errors++;
        return;
      }
      const parsedData = result.data;
      const outputFile = path4.join(outputDir, `${parsedData.name}.json`);
      await writeMetadataJson(outputFile, { ...parsedData, model: modelName, type }, isCustom, modelName);
      stats[statKey]++;
    } catch (error) {
      log.err(`Error extracting ${label} ${file}: ${error instanceof Error ? error.message : error}`);
      stats.errors++;
    }
  });
}
async function extractMaps(parser, dirPath, modelName, stats, isCustom = false) {
  await extractSimpleType(
    dirPath,
    modelName,
    "maps",
    "map",
    "maps",
    (f) => parser.parseMapFile(f),
    stats,
    isCustom,
    "Maps"
  );
}
async function extractConfigurationKeys(parser, dirPath, modelName, stats, isCustom = false) {
  await extractSimpleType(
    dirPath,
    modelName,
    "configuration-keys",
    "configuration-key",
    "configurationKeys",
    (f) => parser.parseConfigurationKeyFile(f),
    stats,
    isCustom,
    "Configuration keys"
  );
}
async function extractLicenseCodes(parser, dirPath, modelName, stats, isCustom = false) {
  await extractSimpleType(
    dirPath,
    modelName,
    "license-codes",
    "license-code",
    "licenseCodes",
    (f) => parser.parseLicenseCodeFile(f),
    stats,
    isCustom,
    "License codes"
  );
}
async function extractSecurityPolicies(parser, dirPath, modelName, stats, isCustom = false) {
  await extractSimpleType(
    dirPath,
    modelName,
    "security-policies",
    "security-policy",
    "securityPolicies",
    (f) => parser.parseSecurityPolicyFile(f),
    stats,
    isCustom,
    "Security policies"
  );
}
async function extractMacros(parser, dirPath, modelName, stats, isCustom = false) {
  await extractSimpleType(
    dirPath,
    modelName,
    "macros",
    "macro",
    "macros",
    (f) => parser.parseMacroFile(f),
    stats,
    isCustom,
    "Macros"
  );
}
var invokedAsScript = process.argv[1] !== void 0 && path4.resolve(process.argv[1]) === path4.resolve(__filename);
if (invokedAsScript) {
  extractMetadata().catch((error) => {
    log.err(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) console.error(error.stack);
    process.exit(1);
  });
}
export {
  EXTRACTED_AOT_DIRS,
  classifyCustom,
  countModelXmlFiles,
  mapModelDirs,
  pruneOrphanedMetadata
};
