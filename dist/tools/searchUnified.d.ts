/**
 * search Tool — unified search entry point.
 *
 * Replaces three search tools with one:
 *   • plain search (default) — name/keyword query across the whole index
 *   • batch — pass `queries[]` to run up to 10 searches in parallel
 *   • scope=extensions — restrict to custom/ISV models only
 *
 * Dispatch is by shape: `queries[]` → batch; else `scope:"extensions"` →
 * extension search; else a single search. Handler files stay where they are —
 * only the MCP surface is consolidated.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function searchUnifiedTool(request: CallToolRequest, context: XppServerContext): Promise<import("../bridge/bridgeAdapter.js").ToolResult | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
}>;
//# sourceMappingURL=searchUnified.d.ts.map