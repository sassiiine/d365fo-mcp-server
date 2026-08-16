/**
 * Index-safe case-insensitive symbol lookups.
 *
 * `name = ? COLLATE NOCASE` cannot use the BINARY-collated name indexes and
 * degrades to a scan of the 1.17M-row symbols table — 13–180 s on a
 * production-size DB with a cold file cache. node:sqlite is synchronous,
 * so that scan blocks the event loop until MCP clients time out and kill the
 * server.
 *
 * Pattern (proven in prepare, d93f004): exact-case probe on idx_name_type
 * (sub-ms) first, FTS5 phrase match (case-folded by the tokenizer) as the
 * fallback for differently-cased input. The FTS candidates are re-checked
 * with `COLLATE NOCASE`, so FTS can only narrow the result, never widen it.
 *
 * `COLLATE NOCASE` stays acceptable only inside an already-narrow indexed
 * range — e.g. `WHERE parent_name = ? AND type = ? AND name = ? COLLATE
 * NOCASE` after the parent name has been canonicalized through one of these
 * lookups.
 */
/** Minimal DB surface these helpers need — satisfied by src/database/sqlite.ts. */
export interface DbLike {
    prepare(sql: string): {
        get(...params: unknown[]): unknown;
        all(...params: unknown[]): unknown[];
    };
}
export interface SymbolHit {
    name: string;
    type: string;
    model: string | null;
    extends_class: string | null;
    file_path: string | null;
}
/**
 * Case-insensitive lookup of top-level symbols (parent_name IS NULL) by name,
 * optionally scoped to a set of types. Exact-case rows come first; rows with
 * different casing are found through the FTS fallback and deduplicated.
 */
export declare function lookupSymbolsNocase(db: DbLike, name: string, opts?: {
    types?: readonly string[];
    limit?: number;
}): SymbolHit[];
/** First case-insensitive top-level hit for a name, or undefined. */
export declare function lookupSymbolNocase(db: DbLike, name: string, types?: readonly string[]): SymbolHit | undefined;
/**
 * Canonical (as-indexed) casing of a top-level object name, or undefined when
 * the name is not in the index. Use this to canonicalize a user-supplied name
 * once, so follow-up probes on parent_name/base_object_name stay BINARY and
 * on-index.
 */
export declare function canonicalSymbolName(db: DbLike, name: string, types?: readonly string[]): string | undefined;
/**
 * All DISTINCT symbol types recorded for a name under any casing and any
 * parent (methods and fields included) — index-safe replacement for
 * `SELECT DISTINCT type FROM symbols WHERE name = ? COLLATE NOCASE`.
 */
export declare function distinctSymbolTypesNocase(db: DbLike, name: string, limit?: number): string[];
//# sourceMappingURL=symbolLookup.d.ts.map