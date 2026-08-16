/**
 * Get Method Source Tool
 * Returns the full X++ source code of a method.
 *
 * PRIMARY: C# bridge (IMetadataProvider) — 100% reliable, always available on VM.
 * SQLite "did you mean?" kept only on error path.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function getMethodSourceTool(request: CallToolRequest, context: XppServerContext): Promise<import("../../bridge/bridgeAdapter.js").ToolResult | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=getMethodSource.d.ts.map