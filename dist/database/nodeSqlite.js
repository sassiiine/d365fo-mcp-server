/**
 * Loads node:sqlite without its `ExperimentalWarning`.
 *
 * Node prints `ExperimentalWarning: SQLite is an experimental feature` to
 * stderr the first time node:sqlite is evaluated. For an MCP server that is not
 * merely noise: stderr is what the IDE surfaces as the server's log, so an
 * unexplained Node warning on every start reads like a fault.
 *
 * The load is done with `createRequire` rather than a static import so that it
 * happens at a moment we control — between patching `process.emitWarning` and
 * restoring it. Ordering a side-effect import ahead of `import 'node:sqlite'`
 * looks equivalent but is not: under an async module loader (vitest's, for one)
 * the two are no longer adjacent, and any restore-later scheme misses.
 *
 * The filter is narrow (SQLite's ExperimentalWarning only) and lives for the
 * duration of one synchronous require, so nothing else loses warnings.
 */
import { createRequire } from 'node:module';
function load() {
    const original = process.emitWarning.bind(process);
    process.emitWarning = ((warning, ...rest) => {
        const message = typeof warning === 'string' ? warning : (warning?.message ?? '');
        const first = rest[0];
        const type = typeof first === 'string' ? first : (first?.type ?? '');
        if (type === 'ExperimentalWarning' && /\bSQLite\b/.test(message))
            return;
        original(warning, ...rest);
    });
    try {
        return createRequire(import.meta.url)('node:sqlite');
    }
    finally {
        process.emitWarning = original;
    }
}
export const { DatabaseSync: DatabaseSyncClass } = load();
//# sourceMappingURL=nodeSqlite.js.map