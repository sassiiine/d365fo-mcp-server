/**
 * Get Configuration Key Info Tool
 * Reads an AxConfigurationKey (or AxLicenseCode) from the SQLite index and shows
 * the feature-gating tree: the key's label, its parent chain, and direct children.
 * Azure-safe READ tool.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function getConfigKeyInfoTool(request: CallToolRequest, context: XppServerContext): Promise<{
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
//# sourceMappingURL=configKeyInfo.d.ts.map