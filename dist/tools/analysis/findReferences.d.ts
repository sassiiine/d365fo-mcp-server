/**
 * Find References Tool
 * Find all usages of a symbol (method, class, field, table)
 * Critical for understanding impact before making changes
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
/**
 * Detect and normalize a label where-used target. Labels live in the xref DB
 * under "/Labels/@<ref>", where <ref> is either the old concatenated form
 * ("@WAX2194") or the newer "@LabelFile:LabelId" form
 * ("@ApplicationPlatform:AbortButtonText"). Both forms are stored verbatim in
 * the xref Names table, so we match exactly and never convert between them.
 * Returns the "/Labels/@…" path, or null when the target isn't a label.
 */
export declare function resolveLabelTarget(targetName: string, targetType?: string): string | null;
export declare function findReferencesTool(request: CallToolRequest, context: XppServerContext): Promise<import("../../bridge/bridgeAdapter.js").ToolResult | {
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
//# sourceMappingURL=findReferences.d.ts.map