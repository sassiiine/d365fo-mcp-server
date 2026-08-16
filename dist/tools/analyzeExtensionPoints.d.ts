/**
 * Analyze Extension Points Tool
 * Show available CoC/event extension points for a D365FO class or table,
 * distinguishing eligible methods from blocked ones, and showing existing extensions
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function analyzeExtensionPointsTool(request: CallToolRequest, context: XppServerContext): Promise<{
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
//# sourceMappingURL=analyzeExtensionPoints.d.ts.map