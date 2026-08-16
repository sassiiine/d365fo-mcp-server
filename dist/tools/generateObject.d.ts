/**
 * Generate Tool — unified code generator.
 *
 * Six modes, discriminated by `mode` (the dispatch switch below is the
 * authority — keep this list in step with it):
 *   • pattern        → named X++ skeleton from a pattern enum (text only, no write)
 *   • scaffold       → pattern-aware whole-object generation: table/form/report
 *   • find-methods   → find / findRecId / exists for a table
 *   • relation-xpp   → a table's relations rendered as X++ select/query
 *   • fields         → field list → AxTableField XML, with EDT inference
 *   • table-relation → EDT-referencing fields → AxTableRelation XML
 *
 * The first two absorbed the retired generate_code and generate_smart tools;
 * the other four were added later and were invisible in this header for long
 * enough that a reader could reasonably conclude they did not exist.
 *
 * Param names of the underlying handlers do not collide and none of their
 * schemas is strict, so the merged arguments are passed straight through; each
 * handler reads its own fields and ignores the `mode` discriminator.
 *
 * Mode-specific parameters arrive nested in `params` (the published schema
 * advertises only that free-form object — issue #825) or flat at top level
 * (legacy callers); both are flattened here before dispatch, and a call missing
 * a required parameter is answered with the mode's complete spec.
 *
 * Note: d365fo_file(action="generate") is intentionally NOT merged here — it
 * produces XML for an existing object definition, a different concern.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function generateObjectTool(request: CallToolRequest, context: XppServerContext): Promise<{
    content: any;
    isError?: boolean | undefined;
}>;
//# sourceMappingURL=generateObject.d.ts.map