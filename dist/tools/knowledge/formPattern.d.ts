/**
 * form_pattern Tool — unified form-pattern entry point.
 *
 * Replaces the three form-pattern tools with one discriminated by `action`:
 *   • analyze  → pattern advisor + usage analysis (recommend / formPattern /
 *                dataSource / similarTo) — the old get_form_patterns
 *   • validate → structural validator of AxForm XML (FP001-FP010)
 *   • spec     → full spec of a pattern / sub-pattern (structure, references)
 *
 * Typical lifecycle: analyze (pick a pattern) → spec (get the structure) →
 * build → validate. Handler files stay where they are — only the MCP surface
 * is consolidated.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare const FORM_PATTERN_ACTIONS: readonly ['analyze', 'validate', 'spec', 'repair'];
export type FormPatternAction = (typeof FORM_PATTERN_ACTIONS)[number];
export declare function formPatternTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
//# sourceMappingURL=formPattern.d.ts.map