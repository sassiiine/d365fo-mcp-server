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
import { DatabaseSyncClass } from './nodeSqlite.js';
const OBJECT_PROTO = Object.prototype;
/**
 * node:sqlite builds rows with a null prototype, so `row.toString()`,
 * `row.hasOwnProperty(...)` and strict structural comparison in tests all
 * behave differently from better-sqlite3. Re-pointing the prototype is an
 * in-place pointer write — far cheaper than rebuilding the object.
 */
function reproto(row) {
    if (row !== null && typeof row === 'object')
        Object.setPrototypeOf(row, OBJECT_PROTO);
    return row;
}
export class Statement {
    stmt;
    constructor(stmt) {
        this.stmt = stmt;
    }
    run(...params) {
        return this.stmt.run(...params);
    }
    get(...params) {
        const row = this.stmt.get(...params);
        return row === undefined ? undefined : reproto(row);
    }
    all(...params) {
        const rows = this.stmt.all(...params);
        for (let i = 0; i < rows.length; i++)
            reproto(rows[i]);
        return rows;
    }
    *iterate(...params) {
        for (const row of this.stmt.iterate(...params)) {
            yield reproto(row);
        }
    }
}
export class Database {
    handle;
    /**
     * Depth of nested transaction() calls. better-sqlite3 nests via SAVEPOINT;
     * plain BEGIN would throw "cannot start a transaction within a transaction".
     */
    txDepth = 0;
    name;
    constructor(filename, options = {}) {
        this.name = filename;
        this.handle = new DatabaseSyncClass(filename, {
            readOnly: options.readonly === true,
            // better-sqlite3 leaves foreign_keys at SQLite's OFF default; node:sqlite
            // turns them on. Our schema has FK columns that are intentionally not
            // enforced (rows are inserted out of order during a build).
            enableForeignKeyConstraints: false,
        });
    }
    get open() {
        return this.handle.isOpen;
    }
    /**
     * `PRAGMA <source>`. With `{ simple: true }` returns the first column of the
     * first row (better-sqlite3's shorthand for scalar pragmas such as
     * journal_mode); otherwise the full row array. Assignment pragmas
     * ("cache_size = -64000") return an empty array.
     */
    pragma(source, options) {
        let rows;
        try {
            rows = this.handle.prepare(`PRAGMA ${source}`).all();
        }
        catch {
            // A handful of pragmas (notably `optimize` under some builds) cannot be
            // prepared as a statement; they still run through exec and yield no rows.
            this.handle.exec(`PRAGMA ${source}`);
            rows = [];
        }
        if (options?.simple) {
            const first = rows[0];
            return first === undefined ? undefined : Object.values(first)[0];
        }
        for (const row of rows)
            reproto(row);
        return rows;
    }
    prepare(sql) {
        return new Statement(this.handle.prepare(sql));
    }
    exec(sql) {
        this.handle.exec(sql);
    }
    /**
     * Wraps `fn` so that calling it runs inside a transaction, rolling back if it
     * throws. Matches better-sqlite3's `db.transaction(fn)`: arguments passed to
     * the returned function are forwarded to `fn`, and the return value is
     * `fn`'s.
     */
    transaction(fn) {
        return (...args) => {
            const depth = this.txDepth++;
            const nested = depth > 0;
            const savepoint = `d365fo_sp_${depth}`;
            this.handle.exec(nested ? `SAVEPOINT ${savepoint}` : 'BEGIN');
            try {
                const result = fn(...args);
                this.handle.exec(nested ? `RELEASE ${savepoint}` : 'COMMIT');
                return result;
            }
            catch (err) {
                try {
                    this.handle.exec(nested ? `ROLLBACK TO ${savepoint}; RELEASE ${savepoint}` : 'ROLLBACK');
                }
                catch {
                    // The connection may already have rolled the transaction back itself
                    // (e.g. SQLITE_FULL); the original error is the one worth reporting.
                }
                throw err;
            }
            finally {
                this.txDepth--;
            }
        };
    }
    close() {
        if (this.handle.isOpen)
            this.handle.close();
    }
}
export default Database;
//# sourceMappingURL=sqlite.js.map