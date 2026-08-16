/**
 * d365fo_file Tool — unified file/metadata-operation entry point.
 *
 * Replaces three tools with one discriminated by `action`:
 *   • generate → produce AOT XML as TEXT only (Azure/Linux fallback, no write)
 *   • create   → write a NEW AOT object file into PackagesLocalDirectory (write)
 *   • modify   → edit an EXISTING object via IMetadataProvider (write)
 *
 * Like `labels`, this mixes a read-capable action (generate works on Azure
 * read-only) with write actions that need local Windows-VM filesystem access;
 * it therefore lives in ALWAYS_TOOLS and the underlying create/modify handlers
 * return a clear error when the local filesystem is not reachable. Handler
 * files stay where they are — only the MCP surface is consolidated.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare const D365_FILE_ACTIONS: readonly ['generate', 'create', 'modify'];
export type D365FileAction = (typeof D365_FILE_ACTIONS)[number];
export declare function d365foFileTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
//# sourceMappingURL=d365foFile.d.ts.map