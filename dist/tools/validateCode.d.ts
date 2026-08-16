/**
 * Validate Tool — unified static validator for generated X++/XML.
 *
 * Merges the former validate_xpp and resolve_references tools into one tool
 * discriminated by `mode`:
 *   • syntax     → offline best-practice/BP rule validation (validate_xpp)
 *   • references → semantic symbol resolution against the index (resolve_references)
 *
 * Both underlying handlers read `code`/`context` from request.params.arguments
 * and ignore the extra `mode` key (no strict schemas), so the request is passed
 * straight through.
 *
 * When mode="references" and codeType="xml-table" or "xml-any", an XML-aware
 * reference checker runs instead of the X++ resolver:
 *   - <ExtendedDataType> → EDT must exist in the symbol index
 *   - <EnumType>         → Enum must exist in the symbol index
 *   - <Label>            → label reference (@File:Id) must exist
 *   - <Extends>          → base table/class must exist (for extensions)
 *   - Relation targets   → <RelatedTable> must exist
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function validateCodeTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
//# sourceMappingURL=validateCode.d.ts.map