/**
 * SQLite access layer — a better-sqlite3-shaped API backed by node:sqlite.
 *
 * Why this exists: better-sqlite3 is a native addon, so installing it runs a
 * lifecycle script (prebuild-install || node-gyp rebuild). npm 12 blocks those
 * by default, which made `npm install -g d365fo-mcp` print an allow-scripts
 * warning, exit 0, and leave the .node binding unbuilt — the failure then
 * surfaced much later as an opaque runtime error. Node 24 (already our minimum,
 * see "engines") ships SQLite 3.51 with FTS5 in core, so the native dependency
 * buys us nothing and costs every user a broken default install.
 *
 * The surface here is intentionally only what this repo uses — pragma(),
 * transaction(), prepare(), exec(), close() and run/get/all/iterate — kept
 * call-compatible with better-sqlite3 so the migration stayed a change of
 * import specifier at ~20 call sites rather than a rewrite of symbolIndex.ts.
 *
 * Two deliberate divergences from node:sqlite's raw behaviour, both chosen to
 * match better-sqlite3 so existing code keeps its meaning:
 *   - foreign keys stay OFF (node:sqlite enables them by default),
 *   - result rows get Object.prototype back (node:sqlite returns null-prototype
 *     objects). Measured at ~0.13 µs/row, versus ~2.3 µs/row for copying.
 */
import { type StatementSync } from './nodeSqlite.js';
/** Options accepted by the constructor (better-sqlite3 spelling). */
export interface DatabaseOptions {
    /** Open the file read-only. Fails if it does not exist. */
    readonly?: boolean;
}
/**
 * Result of a non-SELECT statement. node:sqlite types both fields as
 * `number | bigint` because `setReadBigInts(true)` widens them; we never enable
 * it, so `changes` is narrowed back to the plain number better-sqlite3 promised
 * and the call sites still assume. `lastInsertRowid` keeps the union, matching
 * better-sqlite3's own typing.
 */
export interface RunResult {
    changes: number;
    lastInsertRowid: number | bigint;
}
type Params = readonly unknown[];
export declare class Statement<Row = unknown> {
    private readonly stmt;
    constructor(stmt: StatementSync);
    run(...params: Params): RunResult;
    get(...params: Params): Row | undefined;
    all(...params: Params): Row[];
    iterate(...params: Params): IterableIterator<Row>;
}
export declare class Database {
    private readonly handle;
    /**
     * Depth of nested transaction() calls. better-sqlite3 nests via SAVEPOINT;
     * plain BEGIN would throw "cannot start a transaction within a transaction".
     */
    private txDepth;
    readonly name: string;
    constructor(filename: string, options?: DatabaseOptions);
    get open(): boolean;
    /**
     * `PRAGMA <source>`. With `{ simple: true }` returns the first column of the
     * first row (better-sqlite3's shorthand for scalar pragmas such as
     * journal_mode); otherwise the full row array. Assignment pragmas
     * ("cache_size = -64000") return an empty array.
     */
    pragma(source: string, options?: {
        simple?: boolean;
    }): unknown;
    prepare<Row = unknown>(sql: string): Statement<Row>;
    exec(sql: string): void;
    /**
     * Wraps `fn` so that calling it runs inside a transaction, rolling back if it
     * throws. Matches better-sqlite3's `db.transaction(fn)`: arguments passed to
     * the returned function are forwarded to `fn`, and the return value is
     * `fn`'s.
     */
    transaction<Args extends unknown[], T>(fn: (...args: Args) => T): (...args: Args) => T;
    close(): void;
}
export default Database;
//# sourceMappingURL=sqlite.d.ts.map