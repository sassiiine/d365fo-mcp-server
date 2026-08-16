/**
 * Field type → form control type resolution.
 *
 * The indexed `symbols` table stores a uniform "String" signature for every
 * field, so it cannot tell an enum from a date from a real. To emit the correct
 * AxForm control for each field (ComboBox for enums, Date for dates, …) we read
 * the field's real `i:type` straight from the table's AOT XML — which every
 * indexed field row points at via its `file_path`.
 *
 * Mapping is driven by the field's AxTableField i:type (reliable, present on
 * every field) rather than the EDT name, so it works for custom EDTs too.
 */
export interface ControlTypeInfo {
    /** AxForm control i:type attribute, e.g. 'AxFormComboBoxControl' */
    iType: string;
    /** <Type> element value, e.g. 'ComboBox' */
    typeValue: string;
}
/** Fallback when the field type is unknown — a plain string control is always valid. */
export declare const DEFAULT_CONTROL: ControlTypeInfo;
/**
 * Resolve the form control for a table field, given its AxTableField i:type and
 * (for enums) the bound enum name. NoYes enums become a CheckBox; every other
 * enum a ComboBox — matching how shipped forms render them.
 */
export declare function controlForTableField(tableFieldIType: string, enumType?: string): ControlTypeInfo;
/** field name (lower-cased) → resolved control type */
export type FieldControlMap = Map<string, ControlTypeInfo>;
/**
 * Parse a table's AOT XML into a field→control-type map. Returns an empty map on
 * any failure (missing file, parse issue) — callers fall back to String controls.
 */
export declare function parseTableFieldControls(tableXml: string): FieldControlMap;
/**
 * A view's own XML carries no field TYPES — an `<AxViewFieldBound>` only names
 * the underlying table field. Parse the bindings so the types can be picked up
 * from the tables the view's query reads.
 *
 * `dataSource` is the QUERY datasource alias, not a table name; resolving it
 * needs the query (see {@link parseQueryDataSourceTables}).
 */
export declare function parseViewFieldBindings(viewXml: string): Array<{
    name: string;
    dataField: string;
    dataSource?: string;
}>;
/**
 * Map a query's datasource ALIASES to the tables behind them. In AxQuery XML a
 * datasource's `<Table>` always directly follows its `<Name>`, at every nesting
 * level, so one pass over that pair covers root and child datasources alike.
 */
export declare function parseQueryDataSourceTables(queryXml: string): Map<string, string>;
/** The `<Query>` an AxView is built on, or undefined for a query-less view. */
export declare function parseViewQueryName(viewXml: string): string | undefined;
/**
 * Build a field→control-type map for a table by locating its AOT XML through the
 * symbol index (any field row of the table carries the table's `file_path`).
 * Views are supported too, through the extra query→table hop described in
 * {@link getViewFieldControlMap}.
 *
 * @param db   read-only SQLite handle (symbolIndex.getReadDb())
 * @param table table (or view) name
 */
export declare function getFieldControlMap(db: any, table: string): FieldControlMap;
/**
 * Read `<TitleField1>` out of a table's AOT XML. The element is table-level, so
 * the match is anchored on the FIRST occurrence outside any nested block —
 * `<TitleField1>` exists nowhere else in an AxTable document, so a plain match
 * is safe. Returns undefined when the table declares no title field.
 */
export declare function parseTableTitleField(tableXml: string): string | undefined;
/**
 * Resolve a table's `TitleField1` through the symbol index (same file_path hop as
 * {@link getFieldControlMap}). Used by the form scaffold so a DetailsMaster title
 * control binds to the record's identifying field instead of the alphabetically
 * first one (docs/eval-sweep-findings-2026-07-21.md #32).
 */
export declare function getTableTitleField(db: any, table: string): string | undefined;
/** Control type for a single field from a (possibly undefined) map, defaulting to String. */
export declare function controlForField(field: string, types?: FieldControlMap): ControlTypeInfo;
//# sourceMappingURL=fieldControlTypes.d.ts.map