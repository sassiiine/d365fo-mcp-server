/**
 * Lightweight, advisory X++ select-statement linter.
 *
 * Detects a main-table WHERE clause placed after a join. In X++ a select reads:
 *   select [field] from Main [where mainCond]
 *       [ [exists|notexists|outer] join Buf from T where joinCond ]...
 * The main WHERE must precede every join, and each join clause carries at most one where.
 * Two `where` keywords inside a single join segment means a stray where landed after
 * the join.
 *
 * Advisory only: returns human-readable warnings, never throws or blocks.
 */
/**
 * Inspect X++ source for misplaced WHERE clauses in select statements. Returns a list of
 * advisory warning strings (empty when clean).
 */
export declare function lintXppSelect(source: string | undefined): string[];
//# sourceMappingURL=xppSelectLint.d.ts.map