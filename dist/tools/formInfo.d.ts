/**
 * Get Form Info Tool
 * Extract form structure: controls, datasources, methods
 * Returns control hierarchy, datasource configuration, form methods
 *
 * PRIMARY: C# bridge (IMetadataProvider) — 100% reliable, always available on VM.
 * FALLBACK: explicitFilePath bypass for newly-created forms not yet in bridge.
 * XML parsing helpers are shared by both paths for searchControl filtering.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function getFormInfoTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
//# sourceMappingURL=formInfo.d.ts.map