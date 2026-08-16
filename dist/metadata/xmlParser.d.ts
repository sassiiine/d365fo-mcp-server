/**
 * X++ Metadata XML Parser
 * Parses D365 F&O AOT XML files (AxClass, AxTable, etc.)
 */
import type { XppParseResult, XppClassInfo, XppTableInfo, XppViewInfo } from './types.js';
export interface XppExtensionMembers {
    /** Every method the extension defines. */
    addedMethods: string[];
    /** Subset of addedMethods that wrap a base method via `next` — the CoC hooks. */
    cocMethods: string[];
    /** Raw [SubscribesTo(...)] attribute text, one per subscribing method. */
    eventSubscriptions: string[];
}
/**
 * Classify the methods of an extension into added / CoC-wrapping / event-
 * subscribing. Shared by parseExtensionFile (Ax*Extension XML) and the class
 * extension path in extract-metadata, which reach the same X++ from different
 * XML shapes and must classify it identically.
 */
export declare function extensionMembersFrom(methods: Array<{
    name: string;
    source: string;
}>): XppExtensionMembers;
export interface XppClassExtensionRecord extends XppExtensionMembers {
    name: string;
    baseObjectName: string;
    /** Intrinsic kind from [ExtensionOf] — the base is not always a class. */
    baseKind: string;
    /** Data source / control name for the two-argument intrinsics. */
    baseMemberName?: string;
    sourcePath: string;
    /** Always empty — a class extension adds neither; kept so the record shape
     *  stays uniform with the Ax*Extension kinds that do. */
    addedFields: string[];
    addedIndexes: string[];
    model: string;
    type: 'class-extension';
}
/**
 * Build the class-extension record for an AxClass carrying [ExtensionOf(...)],
 * or null when the class is not an extension.
 *
 * The AOT has no AxClassExtension artifact — class extensions are ordinary
 * AxClass files — so these records are the only source of class-extension rows
 * in symbols/extension_metadata. Extraction writes them into the
 * `class-extensions/` folder symbolIndex.indexExtensions already reads, in the
 * shape parseExtensionFile emits for the other extension kinds (#693).
 */
export declare function buildClassExtensionRecord(classInfo: XppClassInfo, model: string): XppClassExtensionRecord | null;
export declare class XppMetadataParser {
    private enhancedParser;
    private get parser();
    constructor();
    /**
     * Parse an X++ class file (AxClass XML)
     */
    parseClassFile(filePath: string, model?: string): Promise<XppParseResult<XppClassInfo>>;
    /**
     * Parse an X++ table file (AxTable XML)
     */
    parseTableFile(filePath: string, model?: string): Promise<XppParseResult<XppTableInfo>>;
    /**
     * Parse an X++ view/data entity file (AxView or AxDataEntityView XML)
     */
    parseViewFile(filePath: string, model?: string): Promise<XppParseResult<XppViewInfo>>;
    /**
     * Text of a CDATA-bearing element. xml2js hands back a plain string, unless
     * the element carries an attribute (mergeAttrs) — then the text sits under
     * `_` and the raw value is an object.
     */
    private cdataText;
    private parseImplements;
    /**
     * The class's declaration line. Rebuilt from the parsed Declaration CDATA so
     * it reflects what the source actually says; falls back to synthesising one
     * from XML elements when there is no declaration to read.
     */
    private extractClassDeclaration;
    private parseMethods;
    /**
     * The method's access modifier, read from the declaration that was just parsed.
     *
     * It used to be read from a `<Method><Visibility>` element, which real AxClass
     * XML does not have — so every method in the AOT fell through to 'public',
     * including the protected ones, and `get_object_info` printed
     * `- **Visibility:** public` under each of them (#902). The modifiers were in
     * hand two lines above the call all along.
     *
     * The element is still honoured as a fallback for hand-written/synthetic XML
     * and for a declaration too malformed to parse; only then does the X++ default
     * of public apply.
     */
    private parseVisibility;
    /**
     * Parses <AxTableField i:type="AxTableFieldString"> nodes; the field type
     * comes from the i:type XML attribute (field.$['i:type']), not an element.
     */
    private parseFields;
    private parseIndexes;
    private parseIndexFields;
    private parseRelations;
    private parseConstraints;
    private parseViewFields;
    private parseViewRelations;
    private parseViewPrimaryKeyFields;
    private parseViewRelationFields;
    private extractLabelId;
    private ensureArray;
    /**
     * Declaration parameters narrowed to the shape XppMethodInfo carries.
     * A null decl yields `[]`; the `parametersUnknown` flag set alongside is what
     * tells that apart from a genuinely empty list, so don't read this alone.
     */
    private toParameterInfo;
    /**
     * Parse Form XML file (AxForm)
     */
    parseFormFile(filePath: string, model?: string): Promise<XppParseResult<any>>;
    /**
     * Extract form datasources
     */
    private extractFormDataSources;
    /**
     * Extract form methods
     */
    private extractFormMethods;
    /**
     * Parse EDT XML file (AxEdt)
     */
    parseEdtFile(filePath: string, model?: string): Promise<XppParseResult<any>>;
    parseSecurityPrivilegeFile(filePath: string): Promise<XppParseResult<{
        name: string;
        label?: string;
        sourcePath: string;
        entryPoints: Array<{
            name: string;
            objectName: string;
            objectType: string;
            accessLevel: string;
        }>;
    }>>;
    parseSecurityDutyFile(filePath: string): Promise<XppParseResult<{
        name: string;
        label?: string;
        sourcePath: string;
        privileges: string[];
    }>>;
    parseSecurityRoleFile(filePath: string): Promise<XppParseResult<{
        name: string;
        label?: string;
        description?: string;
        sourcePath: string;
        duties: string[];
    }>>;
    parseMenuItemFile(filePath: string, itemType: 'display' | 'action' | 'output'): Promise<XppParseResult<{
        name: string;
        label?: string;
        targetObject?: string;
        targetType?: string;
        securityPrivilege?: string;
        sourcePath: string;
    }>>;
    parseExtensionFile(filePath: string, extensionType: string): Promise<XppParseResult<{
        name: string;
        baseObjectName: string;
        sourcePath: string;
        addedFields: string[];
        addedMethods: string[];
        addedIndexes: string[];
        cocMethods: string[];
        eventSubscriptions: string[];
    }>>;
    /**
     * Parse an AxService file: backing class, external name, namespace, and the
     * exposed service operations (each maps to a public method on the class).
     */
    parseServiceFile(filePath: string): Promise<XppParseResult<{
        name: string;
        serviceClass?: string;
        externalName?: string;
        namespace?: string;
        sourcePath: string;
        operations: {
            name: string;
            method: string;
            idempotent: boolean;
        }[];
    }>>;
    /**
     * Parse an AxMap file: the X++ map class (methods) and its table mappings
     * (each mapping binds the map to a table via field connections).
     */
    parseMapFile(filePath: string): Promise<XppParseResult<{
        name: string;
        extends?: string;
        sourcePath: string;
        methods: string[];
        mappings: {
            table: string;
            fieldConnections: number;
        }[];
    }>>;
    /** Parse an AxConfigurationKey file: label + parent key (feature gating tree). */
    parseConfigurationKeyFile(filePath: string): Promise<XppParseResult<{
        name: string;
        label?: string;
        parentKey?: string;
        sourcePath: string;
    }>>;
    /** Parse an AxLicenseCode file: group, package, type (license-based feature gating). */
    parseLicenseCodeFile(filePath: string): Promise<XppParseResult<{
        name: string;
        label?: string;
        group?: string;
        licensePackage?: string;
        type?: string;
        sourcePath: string;
    }>>;
    /** Parse an AxSecurityPolicy file: row-level (OLS) policy on a primary table. */
    parseSecurityPolicyFile(filePath: string): Promise<XppParseResult<{
        name: string;
        label?: string;
        primaryTable?: string;
        query?: string;
        operation?: string;
        constrainedTable: boolean;
        sourcePath: string;
    }>>;
    /** Parse an AxMacroDictionary file: the #define entries of a shared macro library. */
    parseMacroFile(filePath: string): Promise<XppParseResult<{
        name: string;
        sourcePath: string;
        defines: {
            name: string;
            value: string;
        }[];
    }>>;
    /**
     * Parse an AxServiceGroup file: member services and deployment flag.
     */
    parseServiceGroupFile(filePath: string): Promise<XppParseResult<{
        name: string;
        autoDeploy: boolean;
        description?: string;
        sourcePath: string;
        services: string[];
    }>>;
}
//# sourceMappingURL=xmlParser.d.ts.map