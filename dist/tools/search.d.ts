/**
 * X++ Symbol Search Tool
 * Search for classes, tables, methods, and fields by name or keyword
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function searchTool(request: CallToolRequest, context: XppServerContext): Promise<import("../bridge/bridgeAdapter.js").ToolResult | {
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
//# sourceMappingURL=search.d.ts.map