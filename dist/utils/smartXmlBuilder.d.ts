/**
 * Smart XML Builder
 * Helper class for building D365FO XML structures (AxTable, AxForm)
 * with proper formatting and structure
 */
import { FormPattern } from './formPatternTemplates.js';
import { type FieldControlMap } from './fieldControlTypes.js';
export interface TableFieldSpec {
    name: string;
    edt?: string;
    type?: string;
    mandatory?: boolean;
    label?: string;
    /** Enum name for enum-backed fields (AxTableFieldEnum). When set, the field emits
     *  <EnumType> instead of <ExtendedDataType>. */
    enumType?: string;
}
export interface TableIndexSpec {
    name: string;
    fields: string[];
    unique?: boolean;
    clustered?: boolean;
}
export interface TableRelationSpec {
    name: string;
    targetTable: string;
    constraints: Array<{
        field: string;
        relatedField: string;
    }>;
}
export interface FormDataSourceSpec {
    name: string;
    table: string;
    allowEdit?: boolean;
    allowCreate?: boolean;
    allowDelete?: boolean;
}
export interface FormControlSpec {
    name: string;
    type: 'Grid' | 'Group' | 'String' | 'Int64' | 'Real' | 'Date' | 'DateTime' | 'Button' | 'ActionPane';
    properties?: Record<string, string>;
    children?: FormControlSpec[];
    /** Explicit AxForm control i:type override (e.g. 'AxFormComboBoxControl' for an enum field). */
    iType?: string;
    /** Explicit <Type> value override paired with {@link iType} (e.g. 'ComboBox'). */
    typeValue?: string;
}
/**
 * Read-only view of the mined property_stats table (XppSymbolIndex satisfies
 * this structurally). Populated during build-database from standard Microsoft
 * models, so majority values track the indexed platform version — a reindex of
 * a new PU updates the defaults without touching this code.
 */
export interface MinedPropertyStats {
    getPropertyValueDistribution(nodeType: string, property: string, limit?: number): Array<{
        value: string;
        count: number;
    }>;
}
export declare class SmartXmlBuilder {
    private readonly stats?;
    /** When omitted (or the stats are empty) the builder falls back to its static, BP-validated defaults. */
    constructor(stats?: MinedPropertyStats | undefined);
    /** Majority value mined from standard models, or undefined when no statistics exist. */
    private minedMajority;
    /**
     * Build AxTable XML with fields, indexes, and relations.
     * Structure validated against real D365FO AOT XML (K:\AosService\PackagesLocalDirectory).
     */
    buildTableXml(spec: {
        name: string;
        label?: string;
        tableGroup?: string;
        /**
         * Table storage type. Defined by the TableType property (source: MSDN).
         *   Regular / RegularTable — DEFAULT. Permanent table stored in the main database. Omit from XML (it is the default).
         *   TempDB                 — Temporary table in SQL Server's TempDB database. Dropped when no longer used
         *                            by the current method. Joins and set operations are efficient.
         *   InMemory               — Temporary ISAM file on the AOS/client tier; SQL Server has no connection to it.
         *                            Joins and set operations are usually INEFFICIENT. Equivalent to the old
         *                            "Temporary" property from AX 2009.
         * ⚠️ NEVER pass 'TempDB' or 'InMemory' as the `tableGroup` parameter —
         *    those are NOT valid TableGroup values. Use `tableType` instead.
         */
        tableType?: string;
        fields: TableFieldSpec[];
        indexes?: TableIndexSpec[];
        relations?: TableRelationSpec[];
        methods?: Array<{
            name: string;
            source: string;
        }>;
    }): string;
    /**
     * Build AxForm XML by delegating to the pattern-specific template builder.
     *
     * Each D365FO form pattern has a pre-defined, structurally validated skeleton
     * (ActionPane, QuickFilter, Grid style, etc.) derived from real AOT reference forms.
     *
     * Supported patterns: SimpleList | SimpleListDetails | DetailsMaster |
     *   DetailsTransaction | Dialog | TableOfContents | Lookup
     * Default: SimpleList (most common for new setup/configuration tables)
     */
    buildFormXml(spec: {
        name: string;
        label?: string;
        caption?: string;
        dataSources: FormDataSourceSpec[];
        controls?: FormControlSpec[];
        formPattern?: string;
        gridFields?: string[];
        sections?: Array<{
            name: string;
            caption: string;
        }>;
        linesDsName?: string;
        linesDsTable?: string;
    }): string;
    /**
     * Default form pattern when the caller does not specify one: the most common
     * AxFormDesign.Pattern mined from the indexed standard models, normalized to
     * a supported template. Static fallback: SimpleList (most common for new
     * setup/configuration tables).
     */
    defaultFormPattern(): FormPattern;
    /**
     * Build AxForm XML for a specific pattern directly.
     * Convenience wrapper exposing FormPatternTemplates to callers that already
     * know the pattern (e.g. generateSmartForm.ts).
     */
    buildFormXmlForPattern(pattern: FormPattern, formName: string, dsName?: string, dsTable?: string, caption?: string, gridFields?: string[], sections?: Array<{
        name: string;
        caption: string;
    }>, linesDsName?: string, linesDsTable?: string): string;
    /**
     * Build table field XML node.
     * D365FO uses generic <AxTableField xmlns="" i:type="AxTableFieldString"> format,
     * NOT typed element names like <AxTableFieldString>.
     */
    private buildTableField;
    /**
     * Map EDT/type hint to D365FO AxTableField i:type attribute value.
     * Based on real XML analysis from K:\AosService\PackagesLocalDirectory.
     *
     * Order of precedence:
     *  1. Explicit `type` (primitive base type from DB or caller) — most accurate
     *  2. EDT name heuristics — fallback when type is not known
     */
    private getAxTableFieldType;
    /**
     * Build table index XML node.
     * D365FO uses <AlternateKey>Yes</AlternateKey> for unique indexes — NOT <AllowDuplicates>No>.
     */
    private buildTableIndex;
    /**
     * Build table relation XML node.
     * Constraints use <AxTableRelationConstraint xmlns="" i:type="AxTableRelationConstraintField">.
     */
    private buildTableRelation;
    /**
     * Build form datasource XML node.
     * D365FO: <AxFormDataSource xmlns=""> required to override default form namespace.
     */
    buildFormDataSource(ds: FormDataSourceSpec): string;
    /**
     * Build form control XML node (recursive).
     * D365FO: <AxFormControl xmlns="" i:type="AxFormStringControl"> with required Type and
     * FormControlExtension properties. xmlns="" resets default form namespace.
     */
    buildFormControl(control: FormControlSpec, indentLevel: number): string;
    /**
     * Escape XML special characters. Delegates to the shared escaper — every one
     * of these call sites writes TEXT content, where the Microsoft serializer
     * leaves quotes alone, so the old local `&quot;`/`&apos;` handling only made
     * our files differ from shipped ones.
     */
    private escapeXml;
    /**
     * Generate primary key index for table
     */
    buildPrimaryKeyIndex(tableName: string, fields: string[]): TableIndexSpec;
    /**
     * Generate form grid control with fields
     */
    buildGridControl(name: string, dataSource: string, fields: string[], fieldTypes?: FieldControlMap): FormControlSpec;
}
export { FormPatternTemplates } from './formPatternTemplates.js';
export type { FormPattern, FormTemplateOptions } from './formPatternTemplates.js';
//# sourceMappingURL=smartXmlBuilder.d.ts.map