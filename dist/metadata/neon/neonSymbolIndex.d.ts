import type { XppSymbol } from '../types.js';
import type { NeonIndexConfig } from './neonConfig.js';
export interface LabelHit {
    labelId: string;
    labelFileId: string;
    model: string;
    language: string;
    text: string;
    comment: string | null;
    filePath: string;
}
export declare class NeonSymbolIndex {
    private readonly pool;
    private readonly schema;
    constructor(config: NeonIndexConfig);
    /** Tokenise exactly as XppSymbolIndex.sanitizeFtsQuery does. */
    private tokenize;
    private static boundaryPrefix;
    /**
     * Full-text symbol search — the hot path. Mirrors XppSymbolIndex.searchSymbols.
     * Ordering: FTS5's bm25 `rank` has no Postgres equivalent; we approximate
     * relevance with shortest-name-first (an exact/short name is usually the
     * intended target). This is a documented tuning point, not a correctness one.
     */
    searchSymbols(query: string, limit?: number, types?: string[]): Promise<XppSymbol[]>;
    /** LIKE-contains fallback on name (matches the FTS5 catch fallback). */
    private searchByNameLike;
    /** Prefix search for autocomplete. Mirrors XppSymbolIndex.searchByPrefix. */
    searchByPrefix(prefix: string, types?: string[], limit?: number): Promise<XppSymbol[]>;
    /** Exact (name,type) lookup. Mirrors XppSymbolIndex.getSymbolByName. */
    getSymbolByName(name: string, type: string): Promise<XppSymbol | null>;
    /**
     * Specialised full-source search — powers the event-handler / CoC / reference
     * tools that do `symbols_fts MATCH 'source_snippet:X'`. Scans source_snippet
     * directly (it is not trigram-indexed). Recall matches FTS5; precision can be
     * marginally looser (a few extra hits) because pg_trgm's boundary is slightly
     * broader than FTS5's code tokenizer.
     */
    searchSourceSnippet(token: string, limit?: number): Promise<XppSymbol[]>;
    /** Label search. Mirrors XppSymbolIndex.searchLabels (en-US FTS path). */
    searchLabels(query: string, opts?: {
        language?: string;
        model?: string;
        labelFileId?: string;
        limit?: number;
    }): Promise<LabelHit[]>;
    /**
     * Case-insensitive EXACT name lookup, bounded — the Neon half of the search
     * tool's exact-first splice. The SQLite path used `name = ?` on idx_name_type
     * with an FTS fallback for differently-cased input; here a single
     * case-insensitive equality covers both.
     *
     * `name ILIKE $1` with a LIKE-escaped literal (no wildcards) is deliberate:
     * it is an equality test that pg_trgm's GIN index on search_light can assist,
     * whereas `lower(name) = lower($1)` has no usable index and degrades to a
     * sequential scan of 1.15M rows.
     */
    lookupExactNames(query: string, types?: string[], limit?: number): Promise<Array<{
        name: string;
        type: string;
        model?: string;
        filePath?: string;
    }>>;
    /**
     * Keyword search restricted to CUSTOM models. Mirrors
     * XppSymbolIndex.searchCustomModelSymbols: the token match drives the query
     * and the model filter narrows it to the small custom set.
     */
    searchCustomModelSymbols(query: string, types?: string[], limit?: number): Promise<XppSymbol[]>;
    /**
     * Distinct non-standard models, cached for the process lifetime. The set only
     * changes when the index is rebuilt, and this would otherwise run a DISTINCT
     * over 1.15M rows on every custom probe.
     */
    private customModelsCache;
    private getCustomModels;
    getSymbolCount(): Promise<number>;
    close(): Promise<void>;
    /** Identical mapping to XppSymbolIndex.rowToSymbol so callers see the same shape. */
    private rowToSymbol;
}
//# sourceMappingURL=neonSymbolIndex.d.ts.map