/**
 * Extensibility Tool — unified extensibility analyzer.
 *
 * Merges the former find_coc_extensions, find_event_handlers,
 * get_table_extension_info, analyze_extension_points and
 * recommend_extension_strategy tools into one tool discriminated by `mode`.
 * A single `target` parameter replaces the per-tool className/tableName/
 * objectName/targetClass names; the dispatcher remaps it to whatever the
 * underlying handler expects, so the handlers stay untouched.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function extensionInfoTool(request: CallToolRequest, context: XppServerContext): Promise<import("../bridge/bridgeAdapter.js").ToolResult | {
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=extensionInfo.d.ts.map