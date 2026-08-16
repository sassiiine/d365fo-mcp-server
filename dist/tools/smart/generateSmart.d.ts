/**
 * Generate Smart Tool — unified pattern-aware code generation entry point.
 *
 * Replaces the per-objectType generate_smart_* tools (generate_smart_table,
 * generate_smart_form, generate_smart_report) with one tool discriminated by
 * `objectType`. Dispatches to the existing generator via a local registry;
 * the underlying handlers stay where they are — only the MCP surface is
 * consolidated.
 *
 * The downstream handlers take a plain args object + symbolIndex (+ bridge for
 * table) and return `{ content }`. The dispatcher unwraps the request, forwards
 * the rest of the arguments, and re-wraps the response in the standard tool
 * result shape.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare const GENERATE_SMART_TYPES: readonly ['table', 'form', 'report'];
export type GenerateSmartType = (typeof GENERATE_SMART_TYPES)[number];
type SmartHandler = (args: any, context: XppServerContext) => Promise<any>;
export declare const GENERATE_SMART_DISPATCH: Record<GenerateSmartType, SmartHandler>;
export declare function generateSmartTool(request: CallToolRequest, context: XppServerContext): Promise<{
    content: any;
    isError?: boolean | undefined;
}>;
export {};
//# sourceMappingURL=generateSmart.d.ts.map