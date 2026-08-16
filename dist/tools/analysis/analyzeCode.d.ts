/**
 * analyze_code Tool — unified "learn from the existing codebase" entry point.
 *
 * Replaces four analysis tools with one discriminated by `mode`:
 *   • patterns        → common classes/methods/dependencies for a scenario
 *   • implementations → real implementations of a similar method
 *   • completeness    → missing standard methods on a class
 *   • api-usage       → how an API is initialized and called
 *
 * Handler files stay where they are — only the MCP surface is consolidated.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare const ANALYZE_MODES: readonly ['patterns', 'implementations', 'completeness', 'api-usage'];
export type AnalyzeMode = (typeof ANALYZE_MODES)[number];
export declare function analyzeCodeTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
//# sourceMappingURL=analyzeCode.d.ts.map