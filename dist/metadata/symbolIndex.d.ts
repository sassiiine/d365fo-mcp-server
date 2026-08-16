/**
 * X++ Symbol Index
 * SQLite-based symbol indexing with FTS5 full-text search
 */
import Database, { type Statement } from '../database/sqlite.js';
import type { XppSymbol } from './types.js';
/** Total + per-type symbol counts (both come from one GROUP BY scan). */
export interface SymbolCounts {
    total: number;
    byType: Record<string, number>;
}
/** One extension_metadata row, as both the full build and a reindex write it. */
export interface ExtensionMetadataRecord {
    extensionName: string;
    extensionType: string;
    baseObjectName: string;
    addedFields?: string[];
    addedMethods?: string[];
    addedIndexes?: string[];
    cocMethods?: string[];
    eventSubscriptions?: string[];
    model: string;
}
export declare class XppSymbolIndex {
    db: Database;
    labelsDb: Database;
    private stmtCache;
    private labelsStmtCache;
    private propStatBuffer;
    private nonMicrosoftModels;
    private mineableModelCache;
    private readPool;
    private labelsReadPool;
    private readPoolRR;
    private dbPath;
    private labelsDbPath;
    private symbolCountsCache;
    private symbolCountsPromise;
    private suggestionNamesCache;
    private symbolsByTermCache;
    private perConnStmtCache;
    /**
     * Directory holding the metadata databases. Sibling marker files (the blob-download
     * note, the last-build record) live here so they travel with the index they describe.
     */
    get dataDir(): string;
    constructor(dbPath: string, labelsDbPath?: string);
    /**
     * Returns the next read-only connection from the pool (round-robin).
     * Falls back to the main writer connection when the pool is empty
     * (e.g. :memory: databases used in write-only mode).
     *
     * Tool handlers should use this instead of accessing `db` directly
     * to benefit from read-pool parallelism and per-connection stmt caching.
     */
    getReadDb(): Database;
    /**
     * Close and drain all read-pool connections.
     * Must be called before setting locking_mode = EXCLUSIVE on the writer
     * connection (e.g. in build scripts) — SQLite cannot grant EXCLUSIVE while
     * any other connection (even read-only, even in-process) holds a shared lock.
     */
    closeReadPool(): void;
    /**
     * Get (or lazily prepare) a statement on a specific connection.
     * Uses the per-connection WeakMap cache so statements are never shared
     * across connections.
     *
     * Tool handlers should use `getReadStmt(index.getReadDb(), key, () => sql)`
     * for repeated queries — avoids re-preparing the same SQL on every call.
     */
    getReadStmt(db: Database, key: string, buildSql: () => string): Statement;
    /**
     * Run post-build maintenance tasks: ANALYZE + optimize.
     * Call this at the END of build scripts (after all data is loaded and WAL mode is set).
     * Do NOT call from the production server startup — the pre-built DB already has stats.
     */
    runPostBuildTasks(): void;
    /**
     * Convert database row to XppSymbol with enhanced metadata
     */
    private rowToSymbol;
    private initializeDatabase;
    /**
     * The `labels` indexes that exist purely to accelerate reads, keyed by name so
     * they can be dropped for a bulk load and rebuilt afterwards.
     *
     * `idx_labels_unique` is NOT in here — it enforces the dedupe that
     * INSERT OR REPLACE relies on and has to stay live through the load.
     *
     * The two file_path entries are also created on demand by ensureFilePathIndexes()
     * (which adds the large-DB worker dispatch that startup needs); this list is the
     * single definition of their SQL so the two paths cannot drift apart.
     */
    private static readonly LABEL_SECONDARY_INDEXES;
    /** The subset created at schema-init time; the file_path_id index is left to ensureFilePathIndexes(). */
    private static readonly LABEL_SECONDARY_INDEX_SQL;
    /**
     * Drop the read-only `labels` indexes ahead of a bulk load, and report which ones
     * were actually there so the caller can put back exactly that set.
     *
     * Every row of a bulk load otherwise maintains eight B-trees, two of them keyed on
     * a ~130-character absolute path. Measured on a 400 K-row / 150-model reproduction
     * of this exact write path: 17.2 s with the indexes live versus 10.6 s dropping
     * these seven and rebuilding them at the end (the insert itself, 14.9 s → 4.4 s).
     * This is the same trade the symbols side already makes in ensureFilePathIndexes().
     *
     * Build-time only. Do NOT call this on a server that is answering queries — label
     * search degrades to a full scan until createLabelSecondaryIndexes() finishes.
     */
    dropLabelSecondaryIndexes(): string[];
    /**
     * Rebuild the indexes dropped by dropLabelSecondaryIndexes().
     *
     * Pass the array that call returned to restore exactly the set that was there;
     * omit it to create all of them. Returns the elapsed milliseconds so build scripts
     * can report the cost they moved out of the insert loop.
     */
    createLabelSecondaryIndexes(only?: string[]): number;
    /**
     * Index `symbols.file_path` and `labels.file_path`.
     *
     * Both are the lookup key of removeSymbolsByFile()/removeLabelsByFile(), which
     * every update_symbol_index, undo_last_modification and resync runs first.
     * Unindexed, each of those calls scans the entire table — measured on the 2 GB
     * production DB at 319 s (the SELECT of object names) + 173 s (the DELETE) for
     * indexing a SINGLE new object, versus 0 ms once the index exists. That is why
     * indexing one freshly created object cost as much as a rebuild.
     *
     * Deliberately not part of the CREATE INDEX block above. node:sqlite is
     * synchronous, and building this index over an already-populated production
     * table takes ~8 s, so doing it inline would block the event loop for the whole
     * of startup — the failure mode that makes MCP clients time out and kill the
     * server. On an empty or small DB (a fresh build, the test suite, :memory:) the
     * build is instant and runs here; on a large existing DB it is handed to a
     * worker thread, and until it finishes those deletes simply stay as slow as
     * they are today.
     */
    private ensureFilePathIndexes;
    /**
     * Build one index on a separate thread so the main event loop keeps serving.
     * WAL mode allows the worker's write to proceed alongside main-thread readers.
     * Best-effort: a failure leaves the index absent, which is exactly the state
     * the server ran in before, so it is logged and never thrown.
     */
    private buildIndexInWorker;
    /**
     * Create FTS triggers for keeping symbols_fts in sync
     * Extracted to allow disabling during bulk inserts and re-enabling after
     *
     * symbols_fts is an external-content table, so removals and updates MUST hand the OLD
     * column values back to FTS5 via the 'delete' command. A plain `DELETE FROM symbols_fts`
     * (or `UPDATE symbols_fts SET`) cannot work: the trigger runs AFTER the content row is
     * already gone, leaving FTS5 nothing to re-derive the row's terms from — it fails with
     * "missing row N from content table" and strands the old terms in the index.
     *
     * Dropped and recreated rather than CREATE-IF-NOT-EXISTS so databases still carrying the
     * earlier (broken) definitions are repaired on the next index run.
     */
    private createFTSTriggers;
    /**
     * (Re)create the labels_fts sync triggers — the single definition of them.
     *
     * There is deliberately no language filter here. The triggers used to carry
     * `WHEN LOWER(language) = 'en-us'`, which kept the index one quarter of its size
     * on a four-locale build but made every non-English search fall through to the
     * LIKE scan in searchLabelsLike — measured at 152 s for a four-term `cs` query
     * against a 1.4 M-row table, run synchronously on the event loop so the whole
     * server stalled behind it. The rows are indexed; the space is the cheaper half
     * of that trade. Whatever LABEL_LANGUAGES ingested is what gets tokenised, so a
     * default en-US-only build is unaffected.
     *
     * Dropped and recreated (not CREATE-IF-NOT-EXISTS alone) so a database still
     * carrying the earlier language-filtered definitions is repaired on the next open —
     * mirrors createFTSTriggers on the symbols side.
     */
    private createLabelsFtsTriggers;
    /**
     * Databases built before labels_fts covered every language carry an index holding
     * only en-US rows. Recreating the triggers fixes rows written from now on but
     * cannot retroactively tokenise the ones already there, so the non-English search
     * would stay silently empty until the next full rebuild — exactly the failure this
     * change exists to remove.
     *
     * `PRAGMA user_version` on the labels DB records the coverage generation. It is 0
     * on every database that predates this, so the one-time rebuild is self-triggering
     * and costs nothing on an already-migrated file.
     */
    /**
     * Move an existing database from the inline `labels.file_path` column to the
     * `label_files` lookup table.
     *
     * Runs once, gated on `PRAGMA user_version` like the FTS coverage migration below.
     * A database built before this carries the path spelled out on every row; the
     * column cannot simply be dropped, because the rows have to be rewritten to point
     * at the extracted paths instead.
     *
     * This is a full table rewrite, so it is minutes on a multi-GB labels database
     * rather than the ~23 s the FTS migration costs — announced up front for the same
     * reason: a silent stall of that length reads as a hung server. It is worth paying
     * once. The rewritten table is less than half the size, and every full-table
     * operation on it afterwards (FTS rebuild, ANALYZE, VACUUM, any cold-cache scan)
     * moves proportionally less disk.
     *
     * Row ids are carried over deliberately: `labels_fts` is an external-content index
     * keyed on `labels.id`, so preserving them keeps it valid. It is rebuilt at the end
     * anyway, because the content table it points at is a different table object by then.
     */
    private migrateLabelPathsToLabelFiles;
    private migrateLabelsFtsLanguageCoverage;
    /**
     * Add a symbol to the index with enhanced metadata
     */
    addSymbol(symbol: XppSymbol): void;
    /**
     * All stored forms a file path may take in the index. Full builds store the
     * JSON's sourcePath: CI-extracted custom models normalize it to a
     * PackagesLocalDirectory-relative forward-slash path (see normalizeSourcePath
     * in scripts/extract-metadata.ts), while locally built DBs keep the absolute
     * Windows path with backslashes. Matching every form keeps stale-row cleanup
     * working regardless of which build produced the DB.
     */
    private filePathForms;
    /**
     * Remove all symbols for a given file path from both the main table and FTS index.
     * Matches every stored path form (see filePathForms) so stale rows are removed
     * even when the DB stores a different path form than the caller passed.
     *
     * The comparison is COLLATE NOCASE because SQLite's default BINARY collation made
     * it case-SENSITIVE against a Windows filesystem that is not: `k:\aosservice\…`
     * from a tool argument never matched `K:\AosService\…` as stored by the indexer,
     * so the delete reported 0 rows and every stale symbol stayed searchable. See
     * ensureFilePathIndexes for the NOCASE index that keeps this lookup off a scan.
     *
     * Returns the names of top-level objects that were removed (for cache invalidation).
     */
    /**
     * Top-level object names belonging to one model — the evidence from which a
     * model's naming prefix is inferred (see utils/modelPrefixInference.ts).
     *
     * Deliberately narrow and bounded: only `name`, capped at `limit`. Reading whole
     * rows here would pull source snippets across the wire and turn a 450 ms lookup
     * into a slow one.
     *
     * Extension objects are included on purpose — a dot-notation extension states the
     * model's infix outright — but `parent_name IS NULL` had been quietly excluding
     * them, because an extension ELEMENT is stored as a child of the base object it
     * extends. On ContosoFinanceSK that hid 34 of 36: the model spells its extensions
     * "…ConSKExtension" 35 times and "…ConSkExtension" once, yet inference saw
     * two names, one of each, fell under the 60 % threshold and derived "ConSk"
     * from the regular token instead — flattening the "SK" country code. This server
     * then WROTE a ConSk extension, which became one of the two visible names, so
     * the wrong answer was feeding itself. Members ('method', 'field') are excluded by
     * type, which is what this clause was reaching for.
     *
     * The sample is drawn in two BANDS rather than as one `LIMIT` over the union,
     * because a model with more names than `limit` otherwise lets SQLite decide which
     * ones inference sees — no ORDER BY means no defined subset, and inference is
     * threshold-based (MIN_COVERAGE 60 %), so a skewed sample can flip the answer.
     * The bands also protect the signal: extensions are rare and state the infix
     * outright, regular objects are many and carry the leading token, and
     * inferPrefixFromObjectNames needs BOTH — a single window ordered any way at all
     * would let the larger band crowd the other one out entirely. Each band is capped
     * at half the budget, gives back what it does not use, and is ordered (type, name)
     * so the same model always yields the same sample — a silent, self-reinforcing
     * failure otherwise, since this server writes names with the inferred prefix and
     * those names become evidence for the next inference.
     */
    getModelObjectNames(model: string, limit?: number): string[];
    removeSymbolsByFile(filePath: string): {
        deletedCount: number;
        objectNames: string[];
    };
    /**
     * Remove all labels for a given file path from the labels DB.
     * Matches every stored path form (see filePathForms), like removeSymbolsByFile.
     * Also cleans up the labels FTS index.
     * Returns the count of deleted label rows.
     */
    removeLabelsByFile(filePath: string): number;
    /**
     * Remove all labels matching a specific label_id + model combination.
     * Used when a label is known to have been deleted/reverted.
     */
    removeLabelById(labelId: string, model: string): number;
    /**
     * Sanitize a user query for FTS5 to prevent syntax errors.
     * FTS5 operators (AND, OR, NOT, NEAR, quotes, parens, *) can crash the engine
     * when they appear in raw user input. Wraps each token as a quoted prefix term.
     *
     * Performance: restricts the MATCH to the small/fast columns only.
     * source_snippet and inline_comments hold full X++ source code (100-2000 chars per
     * method × 300K+ methods) — including them in every FTS scan is the single biggest
     * cause of slow symbol searches after table-method indexing was added.
     */
    private sanitizeFtsQuery;
    /**
     * Search symbols by query with full-text search
     * PERFORMANCE: Only select essential columns (name, type, parent_name, signature, model, file_path)
     * Uses prepared statement caching for common queries
     */
    searchSymbols(query: string, limit?: number, types?: string[]): XppSymbol[];
    /**
     * Search symbols by prefix (for autocomplete)
     * PERFORMANCE: Only select essential columns
     */
    searchByPrefix(prefix: string, types?: string[], limit?: number): XppSymbol[];
    /**
     * Get a specific symbol by name and type
     */
    getSymbolByName(name: string, type: string): XppSymbol | null;
    /**
     * Get all classes (for resource listing)
     */
    getAllClasses(): XppSymbol[];
    /**
     * Get symbol count.
     *
     * WARNING: without a warm cache this is a full index scan — 30-60 s on a
     * large production DB with a cold file cache, and node:sqlite blocks the
     * event loop for the whole scan. Server request paths must use
     * getSymbolCounts() (off-thread) or getCachedSymbolCounts() instead; the
     * synchronous form is for build scripts and post-indexing logging where the
     * DB is small or already hot.
     */
    getSymbolCount(): number;
    /**
     * Get symbol count by type. Same event-loop-blocking caveat as getSymbolCount().
     */
    getSymbolCountByType(): Record<string, number>;
    /**
     * Cheap emptiness probe — O(1) regardless of table size. Use this instead of
     * getSymbolCount() === 0 on startup paths.
     */
    hasAnySymbols(): boolean;
    /**
     * Memoized counts if already computed this session, else null. Never scans —
     * safe on any request path (health endpoints, status displays).
     */
    getCachedSymbolCounts(): SymbolCounts | null;
    /**
     * Total + per-type symbol counts without blocking the event loop.
     *
     * The scan runs in a worker thread with its own read-only connection (WAL
     * allows concurrent readers), so the MCP server keeps answering protocol
     * requests while it runs. The result is memoized; concurrent callers share
     * one in-flight computation. Falls back to a synchronous scan when the
     * worker cannot start (:memory: DBs are per-connection and invisible to
     * another thread; under tsx/vitest the compiled worker .js does not exist).
     */
    getSymbolCounts(): Promise<SymbolCounts>;
    /**
     * Drop everything memoized from the symbols table — counts and the suggestion
     * candidate pools. Call after any write that changes symbol rows.
     */
    private invalidateSymbolCounts;
    private computeSymbolCountsSync;
    private computeSymbolCountsInWorker;
    /**
     * Compute usage statistics (usage_frequency and called_by_count) for all methods
     * Should be called after initial indexing is complete
     * Optimized for 300k+ methods with minimal memory usage
     */
    computeUsageStatistics(): void;
    /**
     * Index metadata from a directory.
     *
     * `modelNames` scopes the pass:
     *   - omitted        → index every model directory found under `metadataPath`
     *   - a model name   → index just that one model
     *   - an array       → index exactly those models in a SINGLE pass
     *
     * Pass an array rather than calling this once per model: with the default
     * `ftsStrategy: 'rebuild'` the FTS index is rebuilt from scratch ONCE at the end of the
     * call, which is O(all symbols in the DB), so a per-model loop turns a scoped rebuild
     * into N full-table rebuilds.
     *
     * `ftsStrategy` picks how symbols_fts is brought up to date:
     *   - 'rebuild'     (default) drop the FTS triggers, bulk-insert, then re-tokenise the
     *                   WHOLE symbols table. Cost is O(all symbols) regardless of scope —
     *                   right for a full or near-full rebuild, where it beats per-row triggers.
     *   - 'incremental' keep the FTS triggers live so only the touched rows are re-tokenised.
     *                   Cost is O(scope). Use it when the scope is a small fraction of the
     *                   database (a custom-model build: ~10K of ~1.2M symbols, where the full
     *                   rebuild cost 327s against 5s of actual indexing work).
     */
    /**
     * Turn a write failure inside a model transaction into an error that names
     * the database being written and, when the drive is the likely cause, how
     * much room is left on it.
     *
     * A full disk makes SQLite roll the transaction back itself, so our transaction
     * wrapper then fails to COMMIT and the only thing the user sees is
     * "cannot commit - no transaction is active" with a stack inside the library —
     * no path, no mention of space. That message sent at least one user hunting
     * for a corrupt index when the index was simply being written to the wrong
     * (and nearly full) drive.
     */
    private describeWriteFailure;
    indexMetadataDirectory(metadataPath: string, modelNames?: string | string[], opts?: {
        ftsStrategy?: 'rebuild' | 'incremental';
    }): Promise<void>;
    /**
     * Sort models by JSON file count descending.
     * Ensures the largest models (e.g. Foundation with 56K files) are indexed first,
     * so the most data is committed to disk before any CI pipeline timeout.
     *
     * Uses a single recursive readdirSync per model (Node 18.17+) instead of
     * 20 separate readdirSync calls per subdirectory — ~20× fewer syscalls.
     */
    private sortModelsBySize;
    /**
     * Get the set of models already indexed (for RESUME=true builds).
     */
    getIndexedModels(): Set<string>;
    /**
     * Clear progress tracking checkpoint (call before a fresh full rebuild).
     */
    clearProgressTracking(): void;
    /**
     * Rebuild the FTS index for symbols from scratch.
     * Use this as a standalone step after a SKIP_FTS=true build (Phase 2 of two-phase CI).
     */
    rebuildFTS(): void;
    private getModelDirectories;
    private indexClasses;
    private indexTables;
    private indexEnums;
    private indexEdts;
    private indexReports;
    private indexForms;
    private indexQueries;
    private indexViews;
    private indexSecurityPrivileges;
    private indexSecurityDuties;
    private indexSecurityRoles;
    private indexMenuItems;
    private indexServices;
    private indexServiceGroups;
    private indexMaps;
    private indexConfigurationKeys;
    private indexLicenseCodes;
    private indexSecurityPolicies;
    private indexMacros;
    private indexExtensions;
    /**
     * Replace the extension_metadata row for a single extension.
     *
     * indexExtensions above is the full build's path and reads the extracted JSON;
     * an incremental reindex has only the AOT file, and until it could write here
     * an extension changed in-session was invisible to every reader keyed on
     * base_object_name — resolve_references' field and method checks above all,
     * which report an unknown identifier as an ERROR and, under
     * GROUNDING_ENFORCE, refuse the write carrying it.
     *
     * Delete-then-insert: the table has no unique constraint, so the INSERT OR
     * REPLACE the full build uses only ever appends. Keyed by name + type + model,
     * which is what identifies one extension across a rebuild.
     */
    upsertExtensionMetadata(record: ExtensionMetadataRecord): void;
    /** Drop the extension_metadata row(s) for one extension. Returns rows removed. */
    removeExtensionMetadata(extensionName: string, extensionType: string, model: string): number;
    /** Record "the index was (re)built/updated now" — drives staleness detection. */
    touchLastIndexed(): void;
    /** ISO timestamp of the last full or incremental index update, or null. */
    getLastIndexedAt(): string | null;
    /**
     * Record one observation of a metadata property value.
     * Presence checks use the special values '(present)' / '(absent)'.
     */
    recordPropertyStat(nodeType: string, property: string, value: string, model: string): void;
    /**
     * Flush all buffered property_stats observations to the database in a single
     * batch. Call once at the end of each model's transaction. The buffer is
     * cleared after flushing so repeated calls are safe.
     */
    flushPropertyStats(): void;
    /**
     * Ratio of '(present)' observations for a property across all mined models.
     * Returns total=0 when no statistics exist (validate_xpp falls back to
     * static defaults in that case).
     */
    getPropertyPresenceRatio(nodeType: string, property: string): {
        present: number;
        total: number;
        ratio: number;
    };
    /** Most common values for a property, ordered by observation count. */
    getPropertyValueDistribution(nodeType: string, property: string, limit?: number): Array<{
        value: string;
        count: number;
    }>;
    /**
     * Tell the index which models this run knows to be non-Microsoft, overriding the
     * name-based `isStandardModel()` heuristic for the property-stats miners.
     *
     * `isStandardModel()` reads CUSTOM_MODELS/EXTENSION_PREFIX from the environment, and
     * `build-database` runs as a separate process where CUSTOM_MODELS is deliberately empty
     * on UDE (custom models are path-auto-detected during extract — see
     * src/utils/extractManifest.ts). Without this, our own model and every third-party ISV
     * model under the custom root are mined as if Microsoft had authored them, and the
     * mined defaults that `prepare`/`generate_object`/`validate_code` present as platform
     * convention are really our own past habits fed back to us.
     *
     * The list is additive: a model here is never mined, and models not listed still go
     * through `isStandardModel()`. Pass an empty array to assert "the caller checked and
     * found none" — that is different from never calling this at all.
     */
    setNonMicrosoftModels(models: string[]): void;
    /**
     * Single gate for every property-stats miner: may this model's metadata be mined as
     * evidence of "what the standard Microsoft platform does"?
     */
    private isMineableModel;
    /**
     * Delete property_stats rows for models that today's gate would not mine.
     *
     * The counts are cumulative (`ON CONFLICT ... count + excluded.count`), so gating the
     * miners only stops NEW pollution — rows written by an earlier build survive until
     * something removes them. This is that something, and it is cheap enough to run on every
     * build: the table is tiny (a few thousand rows, ~150 models on a full D365FO index)
     * because it stores one row per node_type/property/value/model, not per object.
     *
     * Re-evaluates every model actually present in the table rather than only the models
     * this run was told about, so it also clears historical pollution — e.g. rows mined
     * before a model was added to CUSTOM_MODELS. It is therefore only as good as the current
     * notion of "non-Microsoft": an ISV model that neither the extract manifest nor
     * isStandardModel() knows about stays until it is declared.
     *
     * Returns the models purged (empty when the corpus is already clean). With
     * `{ dryRun: true }` it returns the same list without deleting anything, so callers can
     * report the damage without duplicating the predicate.
     */
    purgeNonMineableStats(opts?: {
        dryRun?: boolean;
    }): string[];
    /**
     * Mine property statistics from one parsed table JSON. Only standard
     * (Microsoft) models are mined — the stats answer "what does the standard
     * platform do", not "what did our customizations do".
     */
    private recordTablePropertyStats;
    /**
     * Get class methods for autocomplete
     */
    getClassMethods(className: string): XppSymbol[];
    /**
     * Get table fields for autocomplete
     */
    getTableFields(tableName: string): XppSymbol[];
    /**
     * Get completions for a class or table
     */
    getCompletions(objectName: string, prefix?: string): any[];
    /**
     * Search custom extensions by prefix.
     *
     * Restricts results to symbol types whose names carry the `*_Extension` /
     * `*.<model>Extension` convention (class-extension, table-extension, etc.)
     * so that unrelated symbols sharing a substring don't leak into extension UI.
     *
     * `model IN (custom models)` is what makes this affordable, and it has to be the
     * FIRST predicate. A leading-wildcard `name LIKE '%q%'` is unindexable, so with the
     * whole corpus in scope every call scanned all 584 K symbols — measured at 122.8 s on
     * the production DB. Against idx_symbols_model the same scan covers only the ~25
     * custom models. The filter is also a correctness fix: the results were already
     * captioned "matches in custom extensions" while Microsoft rows could satisfy the
     * name convention and appear there.
     *
     * `types` narrows to symbol kinds (the `type` argument of search(scope="extensions"),
     * which used to be dropped before it reached here). A method or field is matched on
     * its PARENT carrying the extension convention — its own name never does.
     */
    searchCustomExtensions(query: string, prefix?: string, limit?: number, types?: string[]): XppSymbol[];
    /**
     * Get list of custom models (non-standard models).
     *
     * Standard-model determination is delegated to `isStandardModel()` from
     * modelClassifier (CUSTOM_MODELS / EXTENSION_PREFIX / configured target model).
     * The legacy `this.standardModels` array is always empty (see
     * `loadStandardModels()`), so filtering against it used to return EVERY model
     * — including Microsoft's — as "custom". Filtering via `isStandardModel()`
     * restores the intended custom-only result.
     */
    getCustomModels(): string[];
    /**
     * Full-text symbol search restricted to CUSTOM/ISV models.
     *
     * Broad keyword searches routed through the C# bridge fill their fixed result
     * window (`maxResults`) in provider-enumeration order, which is dominated by
     * the far larger Microsoft standard corpus — so custom matches that enumerate
     * later get truncated and the search looks like it "only returns Microsoft
     * objects". The search tool probes this method in parallel and splices the
     * custom hits back in, ranked directly after exact-name matches.
     *
     * Index-safe: the FTS5 MATCH drives the query and the `model IN (...)` filter
     * (idx_symbols_model) narrows to the small custom set. The LIKE fallback (only
     * reached on an FTS5 syntax error) is also model-scoped, so the selective
     * `model IN` predicate keeps it off a full `%query%` scan of the whole corpus.
     */
    searchCustomModelSymbols(query: string, types?: string[], limit?: number): XppSymbol[];
    /**
     * Analyze code patterns for a given scenario/domain
     */
    analyzeCodePatterns(scenario: string, classPattern?: string, limit?: number): any;
    /**
     * Detect pattern types from set of classes
     */
    private detectPatternTypes;
    /**
     * Find similar methods based on name and context
     */
    findSimilarMethods(methodName: string, _contextClass?: string, limit?: number): any[];
    getApiUsagePatterns(className: string): any[];
    /**
     * Suggest missing methods for a class based on pattern analysis
     */
    suggestMissingMethods(className: string): any[];
    /**
     * Clear all symbols
     */
    clear(): void;
    /**
     * Clear symbols for specific models
     * @param modelNames - Array of model names to clear
     * @param shouldVacuum - Whether to run VACUUM after deletion (default: false for better incremental build performance)
     */
    clearModels(modelNames: string[], shouldVacuum?: boolean): void;
    /**
     * Vacuum the database to reclaim space after deletions
     */
    private vacuum;
    /**
     * Get candidate symbol names for fuzzy matching ("did you mean" suggestions).
     *
     * When a query is given, candidates are anchored to it: names sharing the
     * query's leading characters plus names sharing its root term (avoids
     * always sampling the same alphabetical slice of a 580K-symbol index).
     * Without a query, falls back to the first 5000 names alphabetically.
     *
     * Both probes go through symbols_fts. `name LIKE '%root%'` cannot use any index
     * — SQLite scans all 1.17M rows, synchronously, on exactly the path an agent hits
     * when it guessed a name wrong, which it does routinely. FTS5 answers a prefix
     * term from its term index instead. The trade is that infix candidates
     * ("MyCustTable" for query "CustTable") are no longer offered; they scored below
     * the 0.7 fuzzy threshold anyway, being far longer than the query.
     */
    getAllSymbolNames(query?: string, limit?: number): string[];
    private computeSymbolNameCandidates;
    /**
     * Get symbols grouped by term (for relationship analysis)
     * Returns a map of term -> symbols with that term
     * Uses iterator to avoid loading all symbols into memory at once
     *
     * Memoized for the lifetime of the index contents: the query takes no arguments
     * and hydrates the same 3000 rows every time, yet it sits on the failed-search
     * path next to getAllSymbolNames — so every name an agent probes and misses paid
     * for a fresh `SELECT *` of 3000 rows on the event loop.
     */
    getSymbolsByTerm(): Map<string, XppSymbol[]>;
    private computeSymbolsByTerm;
    /**
     * Get all symbols for relationship analysis
     * Used to build term relationship graph
     * Uses iterator to avoid memory exhaustion on large datasets
     */
    getAllSymbolsForAnalysis(): XppSymbol[];
    /**
     * Close the database connection and release all pooled resources: the
     * prepared-statement cache, writer + read pool, labels DB + its read pool,
     * and any pending debounced labels FTS rebuild timer.
     */
    close(): void;
    /**
     * Add (or replace) a label entry in the index.
     * Labels live in the separate `labelsDb` connection — NOT in the main symbols DB.
     * The stmtCache is shared across connections so the cache key is namespaced to avoid
     * accidentally reusing a statement prepared against a different DB handle.
     */
    addLabel(entry: {
        labelId: string;
        labelFileId: string;
        model: string;
        language: string;
        text: string;
        comment?: string;
        filePath: string;
    }): void;
    /**
     * Row id of `filePath` in `label_files`, inserting it if it is new.
     *
     * Memoised for the process: a bulk load calls this once per label but there is
     * one distinct path per .label.txt (813 across a default en-US build of 374 K
     * rows), so without the cache it would be ~374 K index probes to learn 813 answers.
     * The cache is only ever added to — rows in label_files are never deleted, since a
     * path that had labels once may have them again after the next scan and the table
     * is trivially small either way.
     */
    private labelFilePathId;
    /** filePath -> label_files.id, populated lazily by labelFilePathId(). */
    private readonly labelFilePathIds;
    /**
     * Bulk-insert labels (drops FTS triggers for speed).
     * Pass `{ skipFtsRebuild: true }` when indexing many models sequentially;
     * the caller must then invoke `rebuildLabelsFts()` once after all models are done.
     */
    bulkAddLabels(entries: Array<{
        labelId: string;
        labelFileId: string;
        model: string;
        language: string;
        text: string;
        comment?: string;
        filePath: string;
    }>, opts?: {
        skipFtsRebuild?: boolean;
        keepTriggers?: boolean;
    }): void;
    /**
     * Rebuild the FTS index for labels from scratch — every row in `labels`, whatever
     * its language.
     *
     * This used to filter to en-US on the theory that it was "the primary search
     * language", which held only as long as nobody searched in another one. On a build
     * with LABEL_LANGUAGES=en-US,cs,sk,de the other three quarters were unreachable
     * through the index, and searchLabels quietly answered them with a LIKE scan of
     * the whole table instead. The index is ~4x larger on such a build; the alternative
     * was a 150 s query.
     */
    rebuildLabelsFts(): void;
    private _labelsFtsTimer;
    private static readonly LABELS_FTS_SETTLE_MS;
    /**
     * Schedule a debounced labels FTS rebuild.
     * Multiple rapid create_label calls defer the expensive rebuild to ~300ms
     * after the last insertion, so a batch of 5 labels triggers only 1 rebuild.
     */
    scheduleLabelsFtsRebuild(): void;
    /** Flush any pending labels FTS rebuild immediately (for tests / shutdown). */
    flushLabelsFtsRebuild(): void;
    /**
     * Full-text search labels within one language (default en-US).
     *
     * Answered from labels_fts, which covers every indexed locale. Only queries FTS5
     * cannot tokenise fall through to the LIKE scan in searchLabelsLike.
     */
    searchLabels(query: string, opts?: {
        language?: string;
        model?: string;
        labelFileId?: string;
        limit?: number;
    }): Array<{
        labelId: string;
        labelFileId: string;
        model: string;
        language: string;
        text: string;
        comment: string | null;
        filePath: string;
        rank: number;
    }>;
    /**
     * LIKE-based fallback label search, for the queries FTS5 cannot tokenise
     * (literal '_'/'%', or nothing but punctuation once sanitised).
     *
     * A leading-wildcard LIKE cannot use an index, so this scans the labels table.
     * The language predicate is written to hit idx_labels_language_lower, which keeps
     * the scan inside one locale instead of all of them; there is no way to make the
     * text comparison itself cheaper here, which is exactly why the FTS path above now
     * covers every language rather than only en-US.
     */
    private searchLabelsLike;
    /**
     * Get a single label by ID (returns all languages).
     *
     * The ID may be spelled any way the rest of the server emits it: a reference
     * (`@ContosoExt:EquipmentName`, `@GLS4170035`, even the doubled
     * `@SYS:@SYS67433`) or the bare key. #888: matching the caller's string
     * against the stored one verbatim made the natural spelling fail for the 27
     * legacy label files, whose keys are stored WITH the sigil — 61% of the
     * indexed rows — and `search` output, which is always a reference, was never
     * valid input here. Both branches of the IN-list still use `idx_labels_id`
     * (and `idx_labels_unique` once the file/model filters are added), so the
     * widening costs nothing; see labelIdSpellings for why the sigil is not
     * normalised away at storage time instead.
     *
     * Rows come back with the id EXACTLY as stored, which is the spelling
     * callers must keep using for anything that reads the .label.txt (see
     * labelMissingOnDisk) or writes a reference.
     */
    getLabelById(labelId: string, labelFileId?: string, model?: string): Array<{
        labelId: string;
        labelFileId: string;
        model: string;
        language: string;
        text: string;
        comment: string | null;
        filePath: string;
    }>;
    /**
     * Get all label file IDs for a model (i.e. which AxLabelFiles exist).
     *
     * Both filters belong in SQL. `labelFileId` used to be applied by the caller to
     * the finished list, so asking about ONE label file still grouped all 1.4 M rows
     * into 1602 groups and then threw 1601 of them away — a full index scan measured
     * at 2.5 s warm, and one cold call in a real session took 28 s against the 40-170 ms
     * every other call to the same tool costs. Pushed into the WHERE clause the same
     * lookup is a seek on idx_labels_file_id: 0.4 ms.
     */
    getLabelFileIds(model?: string, labelFileId?: string): Array<{
        labelFileId: string;
        model: string;
        languages: string;
    }>;
    /**
     * Get the physical .label.txt file path for each language of a label file.
     * Used by labels(action="info", labelFileId=…) so callers get the on-disk
     * location per language instead of having to shell out to find it.
     */
    getLabelFilePaths(labelFileId: string, model?: string): Array<{
        language: string;
        filePath: string;
        model: string;
    }>;
    /**
     * Remove all labels for the given models (used during incremental rebuild)
     */
    clearLabelsForModels(models: string[], opts?: {
        ftsStrategy?: 'rebuild' | 'incremental';
    }): void;
    /**
     * Total label count
     */
    getLabelCount(): number;
    /**
     * Rename a label ID in the index (used by rename_label tool).
     * Updates all rows for the given labelId + labelFileId + model combination.
     *
     * No FTS rebuild: the `labels_au` trigger deletes the old term and inserts the new
     * one for each updated row, which is the whole of the work a rebuild would redo.
     * This used to call rebuildLabelsFts() afterwards — re-tokenising every label in
     * the database (~105 s on the production DB) to reflect a handful of renamed rows,
     * and because node:sqlite is synchronous the server answered nothing for its whole
     * duration. create_label and update_symbol_index were moved off that pattern
     * earlier; this was the last caller still on it.
     */
    renameLabelInIndex(oldLabelId: string, newLabelId: string, labelFileId: string, model: string): void;
}
//# sourceMappingURL=symbolIndex.d.ts.map