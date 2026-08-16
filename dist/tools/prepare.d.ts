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
import type { XppServerContext } from '../types/context.js';
export declare const PREPARE_MODES: readonly ["change", "create"];
export type PrepareMode = (typeof PREPARE_MODES)[number];
export declare function prepareTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
//# sourceMappingURL=prepare.d.ts.map