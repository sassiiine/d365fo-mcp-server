/**
 * Shared builder for AxTable XML.
 *
 * createD365File.ts and generateD365Xml.ts each expose a mirrored
 * XmlTemplateGenerator class; both delegate here so the two cannot drift
 * (mirrors the securityPrivilegeXml.ts / queryViewXml.ts pattern).
 *
 * They had already drifted: the create copy grew canonical property ordering,
 * a real <Fields> block and X++ source handling, while the generate copy kept
 * emitting a bare `<Fields />` and a hand-rolled property block in a different
 * order. Since the documented hybrid flow is generate → create(xmlContent),
 * every table produced that way lost all of its fields — silently, because a
 * table with no fields still builds clean.
 */
/** Field spec as accepted by the tool surface; every key is optional but `name`. */
export interface AxTableFieldSpec {
    name: string;
    edt?: string;
    /**
     * Alias for `edt`, accepted because mapXml.ts, generateTableRelation.ts and
     * the documented op-spec all use this spelling. This path read only `edt`, so
     * a caller writing `extendedDataType` had the EDT silently dropped: the field
     * emitted as a bare AxTableFieldString with no <ExtendedDataType> at all, and
     * nothing reported a problem until the column had the wrong type in the AOT.
     */
    extendedDataType?: string;
    type?: string;
    fieldType?: string;
    enumType?: string;
    mandatory?: boolean;
    label?: string;
}
/** The EDT a field spec names, under either accepted spelling. */
export declare function fieldEdt(f: AxTableFieldSpec): string | undefined;
/** X++ source already split by the caller (see XmlTemplateGenerator.parseSourceForBridge). */
export interface ParsedTableSource {
    declaration?: string;
    methods?: Array<{
        name: string;
        source?: string;
    }>;
}
/**
 * Map a D365FO base type name to the XML i:type attribute used in <AxTableField>.
 * If the explicit fieldType is not a known primitive, fall back to name-based heuristics
 * using edtName (same heuristics as SmartXmlBuilder.getAxTableFieldType).
 */
export declare function fieldTypeToAxType(fieldType: string, edtName?: string): string;
/** Render the <Fields> block from the caller's field specs. */
export declare function buildAxTableFieldsXml(fieldSpecs: AxTableFieldSpec[]): string;
/**
 * Build a complete AxTable document.
 *
 * `parsedSource` is supplied pre-split by the caller rather than parsed here:
 * the splitter lives on XmlTemplateGenerator and pulling it down would drag the
 * whole create tool in behind it. Callers with no X++ simply omit it.
 */
export declare function buildAxTableXml(tableName: string, properties?: Record<string, any>, parsedSource?: ParsedTableSource): string;
//# sourceMappingURL=tableXml.d.ts.map