/**
 * prepare Tool — unified one-call context aggregator.
 *
 * Replaces prepare_change (extending/modifying an existing object) and
 * prepare_create (a brand-new object) with one tool discriminated by `mode`:
 *   • change → signature + CoC wrappers + eligibility + grounding token
 *   • create → collision/naming/EDT/label aggregation + grounding token
 *
 * Both issue a fresh provenance token, so this tool is excluded from the
 * dedup cache. Handler files stay where they are — only the MCP surface is
 * consolidated.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare const PREPARE_MODES: readonly ['change', 'create'];
export type PrepareMode = (typeof PREPARE_MODES)[number];
/** Exported for tests — a long-lived process must not accumulate dead keys. */
export declare function pruneRecentPrepares(now?: number): void;
/**
 * Drop every remembered prepare. Called by d365fo_file after a successful write:
 * once the AOT changes, the aggregated context describes a state that no longer
 * exists, and answering a repeat from it would be worse than re-aggregating —
 * "add-field" prepared before the field existed is exactly the wrong answer after.
 *
 * Deliberately a full clear rather than a targeted eviction: a write to a table
 * invalidates the form context that referenced its fields too, and getting that
 * dependency graph wrong fails silently.
 */
export declare function resetRecentPrepares(): void;
export declare function prepareTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
//# sourceMappingURL=prepare.d.ts.map