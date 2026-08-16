/**
 * Get View Info Tool
 * Extract data entity view structure: computed columns, relations, methods.
 *
 * PRIMARY: C# bridge (IMetadataProvider) — 100% reliable, always available on VM.
 * No SQLite / XML fallback needed — bridge returns complete view metadata.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function getViewInfoTool(request: CallToolRequest, context: XppServerContext): Promise<import("../bridge/bridgeAdapter.js").ToolResult | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=viewInfo.d.ts.map