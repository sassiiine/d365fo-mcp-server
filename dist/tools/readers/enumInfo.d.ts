/**
 * Get Enum Info Tool
 * Extract enum values and enum properties.
 *
 * Read-path priority (same chain as tableInfo / viewInfo):
 *   1. C# bridge (IMetadataProvider) — live metadata.
 *   2. Symbol index → extracted-metadata JSON / AxEnum XML (indexed or remapped path).
 *   3. Disk scan — an enum created this session and not yet indexed.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function getEnumInfoTool(request: CallToolRequest, context: XppServerContext): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    content: {
        type: 'text';
        text: string;
    }[];
}>;
//# sourceMappingURL=enumInfo.d.ts.map