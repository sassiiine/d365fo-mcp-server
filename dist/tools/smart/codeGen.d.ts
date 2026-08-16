/**
 * X++ Code Generation Tool
 * Generate X++ code templates for common patterns
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
export declare function codeGenTool(request: CallToolRequest): Promise<{
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
//# sourceMappingURL=codeGen.d.ts.map