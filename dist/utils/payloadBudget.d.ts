/**
 * Bounding the size of reader responses.
 *
 * A reader payload is billed twice — once when the tool returns, and again on
 * every later round trip that re-reads the conversation — so an unbounded list
 * is the most expensive thing this server can emit. Three readers had one:
 * every field of a Microsoft table (CustTable is ~400 fields; methods already
 * paged, fields did not), the whole control tree of a platform form, and a 2 MB
 * embedded RDL. These helpers exist so those three use ONE paging/capping UX
 * instead of inventing a second and third one next to the method pager.
 */
/** Fields per page. Sized so a paged table header+fields stays near the method page's cost. */
export declare const TABLE_FIELD_PAGE_SIZE = 50;
/** Controls rendered before the tree is cut. A platform form can carry >1000. */
export declare const DEFAULT_MAX_CONTROLS = 150;
export interface FieldPage<T> {
    visible: T[];
    /** Fields on the object, before filtering. */
    total: number;
    /** Fields left after `filter` (=== total when no filter). */
    matched: number;
    offset: number;
    filter?: string;
    hasMore: boolean;
    pageSize: number;
}
/**
 * Apply `fieldFilter` then `fieldsOffset`, mirroring the method pager's contract
 * (offset in multiples of the page size, caller-visible totals).
 */
export declare function pageFields<T extends {
    name: string;
}>(fields: T[], offset?: number, filter?: string, pageSize?: number): FieldPage<T>;
/** Heading text (without the `## ` prefix) that states what the page is a page OF. */
export declare function fieldsHeading<T>(page: FieldPage<T>): string;
/**
 * Footer for a cut field list. Empty when nothing was hidden. Names both ways
 * out — next page and filter — because "call again with an offset" alone makes
 * the agent walk 400 fields one page at a time to find the one it wanted.
 */
export declare function fieldsFooter<T>(page: FieldPage<T>): string;
/** Mutable render budget threaded through a recursive control-tree walk. */
export interface ControlBudget {
    remaining: number;
    omitted: number;
    max: number;
}
export declare function createControlBudget(max?: number): ControlBudget;
/**
 * Charge one control to the budget. `false` means "do not render this node or
 * its children" — the caller still recurses nowhere, and the omission is counted
 * so the footer can quantify it.
 */
export declare function chargeControl(budget: ControlBudget): boolean;
/** Count a subtree that was skipped wholesale (parent already over budget). */
export declare function chargeSkippedSubtree(budget: ControlBudget, count: number): void;
export declare function controlsFooter(budget: ControlBudget): string;
/**
 * Cut `text` to at most `cap` characters WITHOUT ending inside an XML element or
 * mid-line. A raw `slice(0, cap)` on report RDL or generated XML routinely
 * produced a dangling `<Textbox Nam` — output that reads as corrupt metadata
 * rather than as truncated metadata, and that an agent will happily copy.
 *
 * Boundaries are tried best-first (blank line, then newline) and only accepted
 * when they keep at least 80% of the cap, so a single very long line still gets
 * most of its budget; whatever the cut lands on, a trailing partial `<…` tag is
 * always backed off to the last complete `>`.
 */
export declare function truncateOnBlockBoundary(text: string, cap: number): string;
//# sourceMappingURL=payloadBudget.d.ts.map