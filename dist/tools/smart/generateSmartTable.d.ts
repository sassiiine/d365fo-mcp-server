/**
 * Generate Smart Table Tool
 * AI-driven table generation using indexed metadata patterns
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { XppSymbolIndex } from '../../metadata/symbolIndex.js';
import { TableFieldSpec } from '../../utils/smartXmlBuilder.js';
import type { BridgeClient } from '../../bridge/bridgeClient.js';
interface GenerateSmartTableArgs {
    name: string;
    label?: string;
    tableGroup?: string;
    /**
     * Table storage type. Defined by the TableType property (source: MSDN).
     *   Regular / RegularTable — DEFAULT. Permanent table stored in the main database.
     *   TempDB                 — Temporary table in SQL Server TempDB. Dropped when no longer used
     *                            by the current method. Joins/set operations are efficient.
     *   InMemory               — Temporary ISAM file on AOS/client tier. SQL Server has no connection.
     *                            Joins/set operations are usually INEFFICIENT. Same as old AX 2009 "Temporary".
     */
    tableType?: string;
    copyFrom?: string;
    fieldsHint?: string;
    /**
     * Structured field specs. Takes priority over `fieldsHint`, which can only carry
     * names and therefore cannot express enum-backed fields or an explicit EDT.
     */
    fields?: TableFieldSpec[];
    primaryKeyFields?: string[];
    generateCommonFields?: boolean;
    /** Return the XML without touching disk. The default Windows path writes the file (eval #21). */
    preview?: boolean;
    modelName?: string;
    projectPath?: string;
    solutionPath?: string;
    packagePath?: string;
    /**
     * Standard method names to generate and embed in the XML.
     * Supported: "find", "exist"
     * Example: ["find", "exist"]
     */
    methods?: string[];
}
export declare const generateSmartTableTool: Tool;
export declare function handleGenerateSmartTable(args: GenerateSmartTableArgs, symbolIndex: XppSymbolIndex, bridge?: BridgeClient): Promise<any>;
/** Forget memoized EDT base types (test isolation). */
export declare function resetEdtBaseTypeCache(): void;
/**
 * Resolve an EDT's primitive base type via the C# bridge (live IMetadataProvider).
 *
 * The bridge reads the real AxEdt element type (AxEdtDate/AxEdtReal/AxEdtInt64/…),
 * so it correctly distinguishes a ROOT Date/Real EDT from a String one — which the
 * symbol index CANNOT, because it stores extends=null for root EDTs regardless of
 * their primitive. Returns a token compatible with resolveEdtBaseType
 * (String/Integer/Real/Date/Int64/Guid/…), or undefined when the bridge is
 * unavailable, doesn't know the EDT, or reports it as Enum (enum-backed EDTs are
 * handled separately via the enumType path, so we must not emit a bare "Enum" here).
 *
 * Memoized: a table with 20 fields issued 20 readEdt round trips into the C# process
 * for values that cannot change under it, and the same EDTs recur across every table
 * in a scaffold.
 */
export declare function bridgeEdtBaseType(bridge: BridgeClient | undefined, edtName: string): Promise<string | undefined>;
/**
 * Resolve the primitive base type for a D365FO EDT by walking the edt_metadata chain.
 * The `extends` column in edt_metadata stores either a primitive type name
 * (String, Real, Int64, Date, UtcDateTime, Enum, Container, Guid, Integer) or
 * another EDT name. We follow the chain until we reach a primitive type.
 *
 * ⚠️ Index limitation: ROOT EDTs that extend a primitive store extends=null, so this
 * cannot tell a Date/Real root EDT from a String one and defaults such cases to
 * String. Prefer bridgeEdtBaseType() when a bridge is available; this is the
 * offline (Azure/Linux) fallback.
 *
 * Returns a base type string compatible with fieldTypeToAxType(), e.g.:
 *   "Qty" → "Real", "TransDate" → "Date", "ItemId" → "String"
 */
export declare function resolveEdtBaseType(edtName: string, db: any, depth?: number): string | undefined;
/**
 * Resolve the underlying ENUM NAME for an EDT whose own base type is Enum (e.g. "Posted"
 * extends the "NoYes" enum, "SalesStatus" extends its own enum). Mirrors the chain-walk in
 * resolveEdtBaseType() but returns the enum name instead of the literal string "Enum".
 *
 * Needed because resolveEdtBaseType() alone can only tell the caller "this field's type is
 * Enum" — without also knowing WHICH enum, the bridge cannot emit a valid AxTableFieldEnum
 * (it has no EnumType to write) and silently falls back to AxTableFieldString. This was
 * discovered live: a table field created with only `{ name, edt: "Posted" }` (no explicit
 * enumType) resolved `type: 'Enum'` via resolveEdtBaseType() but the created field came back
 * as plain AxTableFieldString with ExtendedDataType=Posted — a valid-looking but semantically
 * wrong field (the compiler accepts a String-typed field pointed at an Enum-based EDT via
 * ExtendedDataType, so this doesn't even fail the build; it just isn't what was asked for).
 *
 * Returns undefined when the EDT isn't enum-backed (or isn't indexed).
 */
export declare function resolveEdtEnumType(edtName: string, db: any, depth?: number): string | undefined;
/**
 * Heuristic base type from an EDT/field name when the EDT is not in the index
 * (e.g. a standard EDT whose edt_metadata wasn't loaded, or a same-session EDT).
 * Mirrors SmartXmlBuilder.getAxTableFieldType's name heuristics but returns the
 * primitive base type so it can be passed explicitly to the C# bridge (which
 * otherwise defaults unknown EDTs to AxTableFieldString).
 * Returns undefined for genuinely unrecognizable names (caller keeps EDT-as-string).
 */
export declare function heuristicEdtBaseType(edtName: string): string | undefined;
/**
 * Check whether a name refers to an indexed ENUM (not an EDT). Used to emit
 * AxTableFieldEnum + EnumType instead of AxTableFieldString + ExtendedDataType
 * for fields whose "EDT" is actually a base enum (e.g. a custom RentStatus enum).
 */
export declare function isEnumName(name: string, db: any): boolean;
/**
 * Check whether an EDT exists in the indexed edt_metadata.
 * Falls back to checking the symbols table for EDT type entries.
 */
/**
 * From the EDTs that resolve to neither an indexed EDT nor an enum, select those
 * that are ALSO absent from disk — i.e. truly missing and guaranteed to fail the
 * build. An EDT whose `AxEdt/<name>.xml` exists in the model package (a
 * same-session custom EDT not yet indexed) is NOT returned: xppc reads it from
 * disk, so the table will build. Used to gate scaffold's one-shot bridge write
 * without false-blocking the valid same-session-EDT workflow.
 *
 * `existsOnDisk` is injectable for testing; defaults to fs.existsSync.
 */
export declare function selectUnbuildableEdts(missingEdts: Array<{
    field: string;
    edt: string;
}>, modelDir: string, existsOnDisk?: (p: string) => boolean): Array<{
    field: string;
    edt: string;
}>;
/**
 * Suggest EDT based on field name heuristics
 */
/**
 * D365FO system-managed field names that are reserved by the platform.
 * Attempting to declare a custom field with one of these names produces
 * the compiler error: "Invalid field name; '<name>' is reserved for system fields."
 * The platform auto-provides these fields — users should NOT add them manually.
 */
export declare const RESERVED_SYSTEM_FIELD_NAMES: Set<string>;
/** Framework/audit fields that should never be auto-injected from frequency mining. */
export declare function isInfrastructureField(fieldName: string): boolean;
/**
 * Resolve the best EDT for a field name, preferring real indexed EDTs over name
 * heuristics. Order: exact EDT-name match → strong fuzzy match (≥0.8) → heuristic
 * that exists in this environment → weaker fuzzy match (≥0.6) → raw heuristic.
 */
export declare function resolveBestEdt(fieldName: string, db: any): string;
export declare function suggestEdtFromFieldName(fieldName: string): string;
export {};
//# sourceMappingURL=generateSmartTable.d.ts.map