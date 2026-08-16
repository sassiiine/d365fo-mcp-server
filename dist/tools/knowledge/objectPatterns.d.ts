/**
 * Patterns Tool — unified pattern toolkit.
 *
 * Merges the former get_table_patterns and form_pattern tools into one tool
 * discriminated by `domain`:
 *   • table → field/index/relation patterns for D365FO tables (get_table_patterns)
 *   • form  → form-pattern toolkit with its own `action` (analyze/spec/validate)
 *
 * The two underlying handlers read their own fields (table: tableGroup/similarTo/
 * limit; form: action/...) and ignore the `domain` discriminator (no strict
 * schemas), so the request is passed straight through.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function objectPatternsTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
//# sourceMappingURL=objectPatterns.d.ts.map