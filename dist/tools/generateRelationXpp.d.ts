/**
 * Relation-to-X++ generator — `generate_object(mode="relation-xpp")`.
 *
 * Ports TRUDUtils "Relation to Xpp": turns a table's relation(s) into ready-to-use
 * X++ — a `select` statement that joins the related table, and an equivalent
 * QueryBuildDataSource/addRange snippet. Field/value constraints are honoured
 * (field == relatedField, and fixed-value constraints become literal ranges).
 *
 * Data source priority mirrors tableInfo: C# bridge (authoritative for relation
 * metadata) → error if unavailable (the symbol index does not carry relations).
 * Output is text X++ the caller pastes into a method body.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export interface RelationConstraintShape {
    field?: string;
    relatedField?: string;
    value?: string;
}
export interface RelationShape {
    name: string;
    relatedTable: string;
    constraints: RelationConstraintShape[];
}
/**
 * Render a `select` statement that fetches the related record for one relation.
 * `sourceBuf` is the buffer name of the table that owns the relation.
 */
export declare function buildRelationSelect(sourceTable: string, rel: RelationShape): string;
/**
 * Render a QueryBuildDataSource + addRange snippet for one relation. Field
 * constraints become ranges driven by the source buffer; fixed-value constraints
 * become literal ranges.
 */
export declare function buildRelationQuery(sourceTable: string, rel: RelationShape): string;
/** Render the requested style(s) for one relation, with a heading comment. */
export declare function buildRelationXpp(sourceTable: string, rel: RelationShape, style: 'select' | 'query' | 'both'): string;
export declare function generateRelationXppTool(request: CallToolRequest, context: XppServerContext): Promise<{
    isError?: boolean | undefined;
    content: {
        type: "text";
        text: string;
    }[];
}>;
//# sourceMappingURL=generateRelationXpp.d.ts.map