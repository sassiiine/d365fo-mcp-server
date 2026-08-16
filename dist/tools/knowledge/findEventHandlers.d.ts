/**
 * Find Event Handlers Tool
 * Locate static event handler subscriptions (SubscribesTo) and delegate subscriptions
 * for a given D365FO class or table
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function findEventHandlersTool(request: CallToolRequest, context: XppServerContext): Promise<import("../../bridge/bridgeAdapter.js").ToolResult | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    isError?: undefined;
    content: {
        type: string;
        text: string;
    }[];
}>;
//# sourceMappingURL=findEventHandlers.d.ts.map