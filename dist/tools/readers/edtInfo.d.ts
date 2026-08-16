/**
 * Get EDT Info Tool
 * Extract Extended Data Type (EDT) properties from AxEdt metadata
 *
 * Standard mode: C# bridge (IMetadataProvider) — 100% reliable, always available on VM.
 * Hierarchy mode: SQLite (edt_metadata table) — ancestor chain walk + children + field usages.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function getEdtInfoTool(request: CallToolRequest, context: XppServerContext): Promise<import("../../bridge/bridgeAdapter.js").ToolResult | {
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
//# sourceMappingURL=edtInfo.d.ts.map