import { NeonSymbolIndex } from './neon/neonSymbolIndex.js';
import { readNeonConfig } from './neon/neonConfig.js';
import { lookupSymbolsNocase } from '../utils/symbolLookup.js';
import { isExactNameMatch } from '../utils/exactMatchRanking.js';
/**
 * Async adapter over the synchronous local SQLite index.
 *
 * It reads the index through a getter rather than capturing it, because the
 * stdio bootstrap constructs the context with an empty in-memory *stub* index
 * and patches the real index in later (see index.ts). Capturing at construction
 * time would pin this adapter to the stub forever; the getter always sees the
 * live instance.
 */
export class SqliteSearchAdapter {
    getIndex;
    constructor(getIndex) {
        this.getIndex = getIndex;
    }
    async searchSymbols(query, limit = 20, types) {
        return this.getIndex().searchSymbols(query, limit, types);
    }
    async searchByPrefix(prefix, types, limit = 20) {
        return this.getIndex().searchByPrefix(prefix, types, limit);
    }
    async getSymbolByName(name, type) {
        return this.getIndex().getSymbolByName(name, type);
    }
    async searchLabels(query, opts = {}) {
        return this.getIndex().searchLabels(query, opts);
    }
    /**
     * Same guards as the original inline probe: a query containing whitespace or
     * FTS metacharacters is not an exact name, and any failure yields [] because
     * the exact-first repair must never break search.
     */
    async lookupExactNames(query, types, limit = 5) {
        if (!query || /[\s*"%]/.test(query))
            return [];
        try {
            const db = this.getIndex().getReadDb?.();
            if (!db)
                return [];
            return lookupSymbolsNocase(db, query, { types, limit })
                .filter(hit => isExactNameMatch(query, hit.name))
                .map(hit => ({
                name: hit.name,
                type: hit.type,
                model: hit.model ?? undefined,
                filePath: hit.file_path ?? undefined,
            }));
        }
        catch {
            return [];
        }
    }
    async searchCustomModelSymbols(query, types, limit = 15) {
        if (!query)
            return [];
        try {
            const idx = this.getIndex();
            return idx.searchCustomModelSymbols?.(query, types, limit) ?? [];
        }
        catch {
            return [];
        }
    }
}
/**
 * Construct the search backend once, at server start. Returns the Neon backend
 * when NEON_DATABASE_URL / DATABASE_URL is set, otherwise a SqliteSearchAdapter
 * over the local index. Call this a single time and store it on the context so
 * the Neon connection pool is shared, not recreated per query.
 */
export function makeSearchBackend(getIndex) {
    const neonConfig = readNeonConfig();
    if (neonConfig)
        return new NeonSymbolIndex(neonConfig);
    return new SqliteSearchAdapter(getIndex);
}
/**
 * Resolve the search backend for a context. Production sets `context.searchIndex`
 * at start via makeSearchBackend(); tests generally do not, so this falls back to
 * a fresh adapter over whatever `context.symbolIndex` the test provided. The
 * fallback is cheap — it only wraps a getter, opening no connections.
 */
export function searchBackend(context) {
    return context.searchIndex ?? new SqliteSearchAdapter(() => context.symbolIndex);
}
//# sourceMappingURL=searchBackend.js.map