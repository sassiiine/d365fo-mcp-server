/**
 * Method Implementation Suggestion Tool
 * Suggest method body based on similar methods in codebase
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function suggestMethodImplementationTool(request: CallToolRequest, context: XppServerContext): Promise<{
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
//# sourceMappingURL=suggestImplementation.d.ts.map