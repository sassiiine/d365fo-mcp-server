/**
 * Create Table Relation — `generate_object(mode="table-relation")`.
 *
 * Ports TRUDUtils "Create Table Relation": for a field whose EDT carries an
 * implicit reference to another table, generate the explicit <AxTableRelation>
 * D365FO now requires (EDT relations must be migrated to table relations —
 * BPErrorEDTNotMigrated). The reference table comes from the indexed
 * edt_metadata.reference_table, so this works in DB-only/Azure environments too.
 *
 * This is the inverse of mode="relation-xpp" (which turns existing relations
 * into X++). Output is text; insert the fragments with d365fo_file.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export interface TableRelationSpec {
    name: string;
    relatedTable: string;
    constraints: Array<{
        field: string;
        relatedField: string;
    }>;
    cardinality?: string;
    relatedTableCardinality?: string;
    relationshipType?: string;
}
/** Render one <AxTableRelation> fragment (matches createD365File / smartXmlBuilder format). */
export declare function buildTableRelationXml(rel: TableRelationSpec): string;
export declare function generateTableRelationTool(request: CallToolRequest, context: XppServerContext): Promise<{
    isError?: boolean | undefined;
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=generateTableRelation.d.ts.map