/**
 * Get Report Info Tool
 * Reads an AxReport and returns structured information:
 * datasets (fields, query), designs (RDL summary or full RDL), data methods.
 *
 * PRIMARY: C# bridge (IMetadataProvider) — 100% reliable, always available on VM.
 * FALLBACK: explicit XML file path for newly-created reports not yet in bridge.
 *
 * Eliminates the need for Copilot to run PowerShell Get-Content on report XML files.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function getReportInfoTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
//# sourceMappingURL=reportInfo.d.ts.map