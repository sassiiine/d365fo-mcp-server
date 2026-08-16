/**
 * get_method Tool — unified method-reader entry point.
 *
 * Replaces the two per-aspect method tools (get_method_signature,
 * get_method_source) with one tool discriminated by `include`:
 *   • signature → modifiers/return type/params/attributes (cheap, for CoC)
 *   • source    → full X++ body
 *   • both      → signature followed by source (default)
 *
 * Both underlying handlers are bridge-backed readers that work in write-only
 * mode via IMetadataProvider; handler files stay where they are — only the MCP
 * surface is consolidated.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare const METHOD_INCLUDES: readonly ['signature', 'source', 'both'];
export type MethodInclude = (typeof METHOD_INCLUDES)[number];
export declare function getMethodTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
//# sourceMappingURL=getMethod.d.ts.map