/**
 * Pluggable search backend for the X++ metadata index.
 *
 * Architecture-A cutover seam. The MCP historically searched the local SQLite
 * FTS5 index directly and synchronously via XppSymbolIndex. To let the index
 * live in the cloud (Neon Postgres) instead, the READ path is expressed as a
 * small async interface, `ISearchIndex`, with two implementations:
 *
 *   - SqliteSearchAdapter — an async wrapper over the existing synchronous
 *     XppSymbolIndex. When Neon is not configured (the default, and every test),
 *     this is what callers get. It simply delegates to the local index, so its
 *     results are byte-identical to the pre-cutover behaviour.
 *   - NeonSymbolIndex — the real cloud backend (see neon/neonSymbolIndex.ts).
 *
 * Only the read primitives that have real call sites are on the interface
 * (searchSymbols / searchByPrefix / getSymbolByName / searchLabels). The heavy
 * `search` tool pipeline (probeExactMatches, suggestion generation, stale-row
 * marking) is still coupled to the local index and is NOT routed through here
 * yet — that is a separate, larger port that must be validated on a Neon
 * instance, not a mechanical await.
 */
import type { XppSymbol } from './types.js';
import type { XppSymbolIndex } from './symbolIndex.js';
import { NeonSymbolIndex } from './neon/neonSymbolIndex.js';
import { readNeonConfig } from './neon/neonConfig.js';
import { lookupSymbolsNocase } from '../utils/symbolLookup.js';
import { isExactNameMatch } from '../utils/exactMatchRanking.js';

/** Unified label-search row. The SQLite path additionally carries `rank`
 *  (FTS5 bm25); Neon has no equivalent, so it is optional. Consumers normalise
 *  snake/camel case themselves and do not depend on `rank`. */
export interface LabelRow {
  labelId: string;
  labelFileId: string;
  model: string;
  language: string;
  text: string;
  comment: string | null;
  filePath: string;
  rank?: number;
}

export interface LabelSearchOpts {
  language?: string;
  model?: string;
  labelFileId?: string;
  limit?: number;
}

/**
 * The async read surface shared by the local (SQLite) and cloud (Neon) indexes.
 * Every method is async: the Neon implementation is a network round-trip, and
 * the SQLite adapter returns an already-resolved promise, so callers `await`
 * uniformly regardless of which backend is active.
 */
export interface ISearchIndex {
  searchSymbols(query: string, limit?: number, types?: string[]): Promise<XppSymbol[]>;
  searchByPrefix(prefix: string, types?: string[], limit?: number): Promise<XppSymbol[]>;
  getSymbolByName(name: string, type: string): Promise<XppSymbol | null>;
  searchLabels(query: string, opts?: LabelSearchOpts): Promise<LabelRow[]>;
  /**
   * Case-insensitive EXACT name lookup, bounded. Powers the search tool's
   * exact-first splice (probeExactMatches), which previously reached past this
   * seam into raw SQLite via getReadDb() — a call that has no meaning when the
   * index lives in Neon and a container has no local database file.
   */
  lookupExactNames(query: string, types?: string[], limit?: number): Promise<ExactHit[]>;
  /**
   * Keyword search restricted to CUSTOM/ISV models. Broad searches routed
   * through the C# bridge fill their window with Microsoft objects and truncate,
   * so custom hits are probed separately and spliced back in.
   */
  searchCustomModelSymbols(query: string, types?: string[], limit?: number): Promise<XppSymbol[]>;
}

/** Minimal row shape the exact-name probe needs. */
export interface ExactHit {
  name: string;
  type: string;
  model?: string;
  filePath?: string;
}

/**
 * Async adapter over the synchronous local SQLite index.
 *
 * It reads the index through a getter rather than capturing it, because the
 * stdio bootstrap constructs the context with an empty in-memory *stub* index
 * and patches the real index in later (see index.ts). Capturing at construction
 * time would pin this adapter to the stub forever; the getter always sees the
 * live instance.
 */
export class SqliteSearchAdapter implements ISearchIndex {
  constructor(private readonly getIndex: () => XppSymbolIndex) {}

  async searchSymbols(query: string, limit = 20, types?: string[]): Promise<XppSymbol[]> {
    return this.getIndex().searchSymbols(query, limit, types);
  }

  async searchByPrefix(prefix: string, types?: string[], limit = 20): Promise<XppSymbol[]> {
    return this.getIndex().searchByPrefix(prefix, types, limit);
  }

  async getSymbolByName(name: string, type: string): Promise<XppSymbol | null> {
    return this.getIndex().getSymbolByName(name, type);
  }

  async searchLabels(query: string, opts: LabelSearchOpts = {}): Promise<LabelRow[]> {
    return this.getIndex().searchLabels(query, opts);
  }

  /**
   * Same guards as the original inline probe: a query containing whitespace or
   * FTS metacharacters is not an exact name, and any failure yields [] because
   * the exact-first repair must never break search.
   */
  async lookupExactNames(query: string, types?: string[], limit = 5): Promise<ExactHit[]> {
    if (!query || /[\s*"%]/.test(query)) return [];
    try {
      const db = (this.getIndex() as unknown as { getReadDb?: () => unknown }).getReadDb?.();
      if (!db) return [];
      return lookupSymbolsNocase(db as never, query, { types, limit })
        .filter(hit => isExactNameMatch(query, hit.name))
        .map(hit => ({
          name: hit.name,
          type: hit.type,
          model: hit.model ?? undefined,
          filePath: hit.file_path ?? undefined,
        }));
    } catch {
      return [];
    }
  }

  async searchCustomModelSymbols(query: string, types?: string[], limit = 15): Promise<XppSymbol[]> {
    if (!query) return [];
    try {
      const idx = this.getIndex() as unknown as {
        searchCustomModelSymbols?: (q: string, t?: string[], l?: number) => XppSymbol[];
      };
      return idx.searchCustomModelSymbols?.(query, types, limit) ?? [];
    } catch {
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
export function makeSearchBackend(getIndex: () => XppSymbolIndex): ISearchIndex {
  const neonConfig = readNeonConfig();
  if (neonConfig) return new NeonSymbolIndex(neonConfig);
  return new SqliteSearchAdapter(getIndex);
}

/**
 * Resolve the search backend for a context. Production sets `context.searchIndex`
 * at start via makeSearchBackend(); tests generally do not, so this falls back to
 * a fresh adapter over whatever `context.symbolIndex` the test provided. The
 * fallback is cheap — it only wraps a getter, opening no connections.
 */
export function searchBackend(
  context: { symbolIndex: XppSymbolIndex; searchIndex?: ISearchIndex },
): ISearchIndex {
  return context.searchIndex ?? new SqliteSearchAdapter(() => context.symbolIndex);
}
