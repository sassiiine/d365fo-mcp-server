/**
 * Get View Info Tool
 * Extract view / data entity view structure: fields, computed columns, relations, methods.
 *
 * Read-path priority (mirrors tableInfo):
 *   1. C# bridge readView       — live AxView metadata (IMetadataProvider).
 *   2. C# bridge readDataEntity — AxDataEntityView; the symbol index stores data
 *      entities as type 'view', so `objectType="view"` legitimately resolves them.
 *   3. Symbol index → extracted metadata JSON / XML on disk — serves offline,
 *      Azure-hosted and "package not on this box" (UDE) scenarios, where `search`
 *      finds the view but the bridge's DiskProvider does not.
 *   4. Disk scan — a view created this session and not yet indexed.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function getViewInfoTool(request: CallToolRequest, context: XppServerContext): Promise<{
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
//# sourceMappingURL=viewInfo.d.ts.map