/**
 * Data Entity Info Tool
 * Retrieve rich D365FO-specific metadata for data entities (OData, DMF, staging, sources).
 *
 * Read-path priority:
 *   1. C# bridge readDataEntity (IMetadataProvider) — live metadata.
 *   2. get_object_info(view) reader — data entities are indexed as type 'view', so its
 *      extracted-metadata / XML / disk chain answers when the bridge is silent.
 *   3. Fuzzy "did you mean?" suggestions from the index.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function dataEntityInfoTool(request: CallToolRequest, context: XppServerContext): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=dataEntityInfo.d.ts.map