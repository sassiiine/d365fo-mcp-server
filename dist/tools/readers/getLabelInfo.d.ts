/**
 * Get Label Info Tool
 * Returns all language translations for a specific label ID.
 * Also lists all available label files (AxLabelFile IDs) for a model.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function getLabelInfoTool(request: CallToolRequest, context: XppServerContext): Promise<{
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
//# sourceMappingURL=getLabelInfo.d.ts.map