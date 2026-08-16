/**
 * Validate Object Naming Tool
 * Validate proposed D365FO object names against naming conventions,
 * detect conflicts against the symbol index, and suggest correct names.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function validateObjectNamingTool(request: CallToolRequest, context: XppServerContext): Promise<{
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
//# sourceMappingURL=validateObjectNaming.d.ts.map