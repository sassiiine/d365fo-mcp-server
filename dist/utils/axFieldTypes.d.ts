/**
 * The one canonical D365FO field base-type map.
 *
 * There used to be five copies of this dictionary — createD365File.ts
 * (fieldTypeToAxType), generateTableFields.ts (axTableFieldType),
 * smartXmlBuilder.ts (getAxTableFieldType), mapXml.ts (FIELD_TYPE_TO_AXTYPE) and
 * the C# CreateTableField switch — and they disagreed on both spelling and
 * casing, all of them looking up a Record<string,string> with a raw `||`
 * fallback to String. Three concrete wrong writes came out of that:
 *
 *   • mapXml's copy keyed Integer as `Int`, so the documented `type:"Integer"`
 *     missed and the map field was written AxMapFieldString — a silently
 *     mistyped field that builds clean.
 *   • every copy was case-SENSITIVE, so `type:"integer"` / `"guid"` fell through
 *     to String as well.
 *   • mapXml's copy mapped `Boolean` to `AxMapFieldBoolean`, which is not a
 *     metamodel element at all (verified by reflection over
 *     Microsoft.Dynamics.AX.Metadata.dll: the AxMapField* family is Container,
 *     Date, Enum, Guid, Int, Int64, Real, String, Time, UtcDateTime — no
 *     Boolean). D365FO has no boolean field type; it uses an Enum field over
 *     NoYes.
 *
 * The element families below are the reflected metamodel type names, not a
 * guess. Lookup is case-insensitive and also accepts a full i:type element name
 * ("AxTableFieldInt"), because callers copy those out of XML they just read.
 */
/** Canonical spelling of every base type a D365FO field can have. */
export type AxFieldBaseType = 'String' | 'Integer' | 'Int64' | 'Real' | 'Date' | 'Time' | 'UtcDateTime' | 'Enum' | 'Container' | 'Guid';
export declare const AX_FIELD_BASE_TYPES: readonly AxFieldBaseType[];
/**
 * Canonical base type for any spelling a caller might send, or undefined when
 * the input names no D365FO field type. Undefined is the caller's cue to fall
 * back (EDT-name heuristics) or to refuse — never to quietly emit String.
 */
export declare function normalizeFieldBaseType(raw: unknown): AxFieldBaseType | undefined;
/** `<AxTableField i:type="…">` element for a canonical base type. */
export declare function axTableFieldElement(base: AxFieldBaseType): string;
/** `<AxMapBaseField i:type="…">` element for a canonical base type. */
export declare function axMapFieldElement(base: AxFieldBaseType): string;
/**
 * Base type guessed from an EDT NAME, for the case where the caller gave an EDT
 * but no base type and the EDT is not (yet) in the index. Extracted verbatim
 * from the three identical copies it used to have; the order of the tests is
 * load-bearing (RecId before Int, UtcDateTime before Date).
 */
export declare function baseTypeFromEdtName(edtName: string | undefined): AxFieldBaseType | undefined;
/**
 * The error text every builder uses when a caller names a type that does not
 * exist. Spelling out the accepted set is the whole point: the failure mode this
 * replaces was a String field written under a wrong name and reported as success.
 */
export declare function unknownFieldTypeMessage(context: string, raw: string): string;
//# sourceMappingURL=axFieldTypes.d.ts.map