/**
 * Labels Tool — unified label-operations entry point.
 *
 * Replaces the four per-action label tools (search_labels, get_label_info,
 * create_label, rename_label) with one tool discriminated by `action`.
 * Dispatches to the existing handler for that action via a local registry;
 * handler files stay where they are — only the MCP surface is consolidated.
 *
 * Read actions (search, info) work in every server mode. Write actions
 * (create, rename) require Windows-VM filesystem access and fail with the
 * underlying handler's clear error message when called from Azure read-only.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
import { mapWithConcurrency } from '../utils/concurrency.js';
export type LabelsTool = (request: CallToolRequest, context: XppServerContext) => Promise<any>;
export declare const LABEL_ACTIONS: readonly ['search', 'info', 'create', 'update', 'rename'];
export type LabelAction = (typeof LABEL_ACTIONS)[number];
interface LabelDispatch {
    tool: LabelsTool;
    toolName: string;
}
export declare const LABEL_DISPATCH: Record<LabelAction, LabelDispatch>;
export declare function labelsTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
/**
 * Re-exported from utils/concurrency so the label indexer can share the same helper
 * without importing from the tools layer. Kept exported here for existing callers/tests.
 */
export { mapWithConcurrency };
//# sourceMappingURL=labels.d.ts.map