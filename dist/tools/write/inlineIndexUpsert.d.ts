/**
 * In-process symbol-index upsert for the create/modify paths.
 *
 * A newly created EDT, enum or table is not in the SQLite symbol index until
 * something indexes it, and until then `search` and every reader that consults
 * the index behave as though it does not exist. The server said so itself: a
 * create warned the agent to call update_symbol_index, which it then did — two
 * more round trips (the index call, then the retried lookup) for a file this
 * process had just written and can parse in milliseconds.
 *
 * The parser is in-process. There is no reason for that to be a round trip.
 *
 * Deliberately best-effort and non-fatal: the write already succeeded and is on
 * disk, so a failure to index must never turn a successful create into an error.
 * It downgrades to the note the tool used to print, which is exactly the old
 * behaviour — no worse than before, and only for the cases that actually fail.
 */
import type { XppServerContext } from '../../types/context.js';
/**
 * Suffix appended to a write response, or '' when there is nothing to say.
 *
 * The context is accepted partially: the create path threads a narrowed
 * `{ bridge, symbolIndex }` around, and the indexer only ever reads
 * `symbolIndex`. Requiring the full shape here would mean widening that,
 * for no benefit.
 */
export declare function upsertWrittenFileIntoIndex(filePath: string | undefined, context: Partial<XppServerContext> | undefined): Promise<string>;
//# sourceMappingURL=inlineIndexUpsert.d.ts.map