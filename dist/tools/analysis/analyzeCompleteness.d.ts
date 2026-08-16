/**
 * Class Completeness Analysis Tool
 * Analyze class and suggest missing methods based on patterns
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function analyzeClassCompletenessTool(request: CallToolRequest, context: XppServerContext): Promise<{
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
//# sourceMappingURL=analyzeCompleteness.d.ts.map