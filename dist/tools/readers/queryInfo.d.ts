/**
 * Get Query Info Tool
 * Extract query structure: datasources, ranges, joins.
 *
 * Read-path priority (same chain as tableInfo / viewInfo):
 *   1. C# bridge (IMetadataProvider) — live metadata.
 *   2. Symbol index → query XML (indexed path, or remapped onto the local packages root).
 *   3. Disk scan — a query created this session and not yet indexed.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function getQueryInfoTool(request: CallToolRequest, context: XppServerContext): Promise<{
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
//# sourceMappingURL=queryInfo.d.ts.map