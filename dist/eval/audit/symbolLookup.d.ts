/**
 * Shared symbol-index lookup for the knowledge audit.
 *
 * Extracted from knowledgeAuditCli so the CLI (`--capture`) and the CI test
 * (tests/knowledge/apiSymbols.test.ts) resolve knowledge references through the
 * exact same query logic — a single source of truth for "does this AOT element
 * exist". Pure I/O: opens the read-only 2 GB SQLite index and returns a
 * {@link SymbolLookup} plus the index's `last_indexed_at` stamp.
 */
import type { SymbolLookup } from './knowledgeAudit.js';
/**
 * Loads the whole element-name table into memory once (~135k rows). A
 * per-name `COLLATE NOCASE` query would full-scan the 2 GB index for every
 * lookup (see memory/sqlite-query-antipatterns); one sequential pass over the
 * indexed `type` column is both correct and ~1000x cheaper here.
 */
export declare function openSymbolLookup(dbPath: string): Promise<{
    lookup: SymbolLookup;
    indexedAt: string;
}>;
//# sourceMappingURL=symbolLookup.d.ts.map