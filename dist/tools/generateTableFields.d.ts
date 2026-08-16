/**
 * Fields Builder — `generate_object(mode="fields")`.
 *
 * Ports TRUDUtils "Fields Builder": turn a plain list of field names (or an
 * Excel-style paste) into ready-to-insert AxTableField XML, with the EDT for
 * each field auto-resolved from the indexed metadata, the correct AxTableField
 * i:type derived from that EDT's base type (so Real/Date/Int64/enum fields don't
 * all collapse to String), and an optional field-group fragment listing them.
 *
 * Pure EDT/type resolution is reused from generateSmartTable so behaviour stays
 * consistent with whole-table scaffolding. Output is text; the caller inserts
 * the fields with d365fo_file(action="modify") add-field on the existing table.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export interface ResolvedField {
    name: string;
    edt?: string;
    enumType?: string;
    type?: string;
    label?: string;
    mandatory?: boolean;
}
/** Map an EDT/base-type pair to the AxTableField i:type — mirrors SmartXmlBuilder. */
export declare function axTableFieldType(edt?: string, type?: string, enumType?: string): string;
/** Render one <AxTableField> fragment (D365FO generic i:type format). */
export declare function buildFieldXml(f: ResolvedField): string;
/** Render an <AxTableFieldGroup> fragment listing the given fields. */
export declare function buildFieldGroupXml(groupName: string, fieldNames: string[]): string;
/** Parse a comma/newline-separated hint into field-name tokens. */
export declare function parseFieldsHint(hint: string): string[];
/**
 * Resolve EDT, enum and base type for one field. `db` is the read-only symbol
 * index handle; when null (no index) only explicit values + name heuristics are
 * used. Returns the resolved field plus an optional warning string.
 */
export declare function resolveField(input: ResolvedField, db: any): {
    field: ResolvedField;
    warning?: string;
};
export declare function generateTableFieldsTool(request: CallToolRequest, context: XppServerContext): Promise<{
    isError?: boolean | undefined;
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=generateTableFields.d.ts.map