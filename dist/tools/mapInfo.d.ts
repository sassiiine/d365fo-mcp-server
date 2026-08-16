/**
 * Get Map Info Tool
 * Reads an AxMap from the SQLite index: the X++ map class, its methods, and the
 * tables it maps onto (with field-connection counts). Azure-safe READ tool.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function getMapInfoTool(request: CallToolRequest, context: XppServerContext): Promise<{
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
//# sourceMappingURL=mapInfo.d.ts.map