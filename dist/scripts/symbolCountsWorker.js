// src/metadata/symbolCountsWorker.ts
import { parentPort, workerData } from "node:worker_threads";

// src/database/nodeSqlite.ts
import { createRequire } from "node:module";
function load() {
  const original = process.emitWarning.bind(process);
  process.emitWarning = ((warning, ...rest) => {
    const message = typeof warning === "string" ? warning : warning?.message ?? "";
    const first = rest[0];
    const type = typeof first === "string" ? first : first?.type ?? "";
    if (type === "ExperimentalWarning" && /\bSQLite\b/.test(message)) return;
    original(warning, ...rest);
  });
  try {
    return createRequire(import.meta.url)("node:sqlite");
  } finally {
    process.emitWarning = original;
  }
}
var { DatabaseSync: DatabaseSyncClass } = load();

// src/database/sqlite.ts
var OBJECT_PROTO = Object.prototype;
function reproto(row) {
  if (row !== null && typeof row === "object") Object.setPrototypeOf(row, OBJECT_PROTO);
  return row;
}
var Statement = class {
  constructor(stmt) {
    this.stmt = stmt;
  }
  stmt;
  run(...params) {
    return this.stmt.run(...params);
  }
  get(...params) {
    const row = this.stmt.get(...params);
    return row === void 0 ? void 0 : reproto(row);
  }
  all(...params) {
    const rows = this.stmt.all(...params);
    for (let i = 0; i < rows.length; i++) reproto(rows[i]);
    return rows;
  }
  *iterate(...params) {
    for (const row of this.stmt.iterate(...params)) {
      yield reproto(row);
    }
  }
};
var Database = class {
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
      enableForeignKeyConstraints: false
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
    } catch {
      this.handle.exec(`PRAGMA ${source}`);
      rows = [];
    }
    if (options?.simple) {
      const first = rows[0];
      return first === void 0 ? void 0 : Object.values(first)[0];
    }
    for (const row of rows) reproto(row);
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
      this.handle.exec(nested ? `SAVEPOINT ${savepoint}` : "BEGIN");
      try {
        const result = fn(...args);
        this.handle.exec(nested ? `RELEASE ${savepoint}` : "COMMIT");
        return result;
      } catch (err) {
        try {
          this.handle.exec(
            nested ? `ROLLBACK TO ${savepoint}; RELEASE ${savepoint}` : "ROLLBACK"
          );
        } catch {
        }
        throw err;
      } finally {
        this.txDepth--;
      }
    };
  }
  close() {
    if (this.handle.isOpen) this.handle.close();
  }
};
var sqlite_default = Database;

// src/metadata/symbolCountsWorker.ts
var { dbPath } = workerData;
try {
  const db = new sqlite_default(dbPath, { readonly: true });
  try {
    db.pragma("busy_timeout = 5000");
    const rows = db.prepare(`SELECT type, COUNT(*) as count FROM symbols GROUP BY type`).all();
    const byType = {};
    let total = 0;
    for (const row of rows) {
      byType[row.type] = row.count;
      total += row.count;
    }
    parentPort.postMessage({ ok: true, total, byType });
  } finally {
    db.close();
  }
} catch (e) {
  parentPort.postMessage({ ok: false, error: String(e) });
}
