/**
 * API Usage Patterns Tool
 * Analyze how specific APIs are commonly used in the codebase
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function getApiUsagePatternsTool(request: CallToolRequest, context: XppServerContext): Promise<import("../bridge/bridgeAdapter.js").ToolResult | {
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=apiUsagePatterns.d.ts.map