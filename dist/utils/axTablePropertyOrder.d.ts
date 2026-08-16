/**
 * Canonical element order for AxTable XML.
 *
 * AxTable documents are ORDER-SENSITIVE and the deserializer drops misordered
 * property elements SILENTLY: the property is physically in the file, `validate_code`
 * happily reports "no violations", and xppbp then complains that it is missing
 * (BPErrorTableTitleField1NotDeclared / BPErrorLabelNotDefined /
 * BPErrorDeveloperDocumentationNotDefined) with no clue why.
 * See docs/eval-sweep-findings-2026-07-21.md #13.
 *
 * Ground truth for the order below:
 *   - eval/goldens/L1-table-basic/DemoAgentNote.metadata.xml (VM-captured, built clean):
 *       Label → TableGroup → TitleField1 → TitleField2 →
 *       CacheLookup → ClusteredIndex → PrimaryIndex → ReplacementKey → DeleteActions
 *   - the sweep's own comparison against the shipped CustGroup.xml.
 *
 * Two blocks, each internally alphabetical:
 *   1. the "always serialised" block (ConfigurationKey … TitleField2)
 *   2. the extended/optional block (CacheLookup … TableType)
 * Collections (<DeleteActions>, <FieldGroups>, <Fields>, …) follow both.
 */
/** Full canonical order of everything that follows <SourceCode>. */
export declare const AX_TABLE_ELEMENT_ORDER: readonly string[];
/**
 * Table-level property names that DO NOT EXIST in the AxTable metadata model and
 * are therefore silently ignored (or worse, make the document unreadable).
 * `AlternateKey` is index-level only — `<AxTableIndex><AlternateKey>Yes</AlternateKey>`
 * — but reads so naturally at table level that both the writer surface and the
 * validator missed it (findings #13).
 */
export declare const AX_TABLE_NON_EXISTENT_PROPERTIES: Record<string, string>;
/** Canonical position of an element; unknown names sort last but keep relative order. */
export declare function axTableElementRank(name: string): number;
/**
 * Render a property map as canonically ordered `<Tag>value</Tag>` lines.
 * Entries whose value is undefined/null/'' are omitted — an empty
 * `<TitleField1 />` is not the same as an absent one to xppbp, and the shipped
 * tables omit properties they do not set.
 *
 * @param props  property name → value
 * @param indent line prefix (default one tab, matching AxTable XML)
 */
export declare function renderAxTableProperties(props: Record<string, string | number | undefined | null>, indent?: string): string;
/**
 * Insert (or replace) a single table-level property in an AxTable XML document,
 * keeping canonical order. Returns null when the document is not an AxTable or
 * the property is one that does not exist at table level.
 *
 * Used by the modify surface so a missing property (e.g. FormRef, which the C#
 * bridge's setProperty rejects outright — findings #37) can still be written
 * without corrupting the element order.
 */
export declare function upsertAxTableProperty(xml: string, property: string, value: string): string | null;
//# sourceMappingURL=axTablePropertyOrder.d.ts.map