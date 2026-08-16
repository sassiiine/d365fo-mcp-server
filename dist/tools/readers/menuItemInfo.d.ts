/**
 * Menu Item Info Tool
 * Retrieve details for D365FO menu items including target objects and security chain
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function menuItemInfoTool(request: CallToolRequest, context: XppServerContext): Promise<import("../../bridge/bridgeAdapter.js").ToolResult | {
    isError?: undefined;
    content: {
        type: string;
        text: string;
    }[];
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=menuItemInfo.d.ts.map