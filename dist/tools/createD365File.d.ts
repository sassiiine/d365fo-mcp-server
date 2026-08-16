/**
 * D365FO File Creator Tool
 * Creates physical XML files in the AOT package structure
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
/**
 * Project File Finder
 * Finds .rnrproj files in solution directory or specific paths
 */
export declare class ProjectFileFinder {
    /**
     * Find .rnrproj file in solution directory
     * Recursively searches for .rnrproj files matching the model name (up to 3 levels deep)
     */
    static findProjectInSolution(solutionPath: string, modelName: string): Promise<string | null>;
    private static findRecursive;
}
/**
 * Normalize the flexible field specs accepted by the tool / XML generators
 * (`{ name, edt?, type?, fieldType?, extendedDataType?, enumType?, mandatory?, label? }`)
 * into the key shape the C# bridge's WriteFieldParam ACTUALLY deserializes.
 *
 * CRITICAL: WriteFieldParam uses `[JsonPropertyName("type")]` and
 * `[JsonPropertyName("edt")]` — the bridge reads the JSON keys `type` and `edt`,
 * NOT `fieldType`/`extendedDataType`. Emitting the latter silently loses both:
 * the bridge sees FieldType=null → CreateTableField falls to the default branch and
 * produces a bare AxTableFieldString with no ExtendedDataType. (This bit
 * table-extension AND table create — both share this path.) Accept either input
 * spelling and always emit the bridge's keys. `type` may arrive as a base-type
 * keyword ("Integer") or a full i:type ("AxTableFieldInt"); the latter is stripped
 * back to the keyword the bridge's CreateTableField switch understands.
 */
export declare function normalizeFieldSpecsForBridge(fields: Record<string, unknown>[]): Record<string, unknown>[];
/**
 * Normalize index specs into the bridge's WriteIndexParam shape.
 *
 * CRITICAL: WriteIndexParam.Fields is a `List<string>`, but the documented tool
 * input (and every other collection here) uses objects —
 * `fields: [{ fieldName, direction? }]`. Handing the bridge the documented shape
 * makes System.Text.Json throw while deserializing the whole create request, so
 * bridgeCreateObject returns null and the ENTIRE table silently falls back to
 * the TypeScript generator — losing the indexes AND the field groups with it.
 * Accept either spelling and always emit plain field-name strings.
 */
export declare function normalizeIndexSpecsForBridge(indexes: Record<string, unknown>[]): Record<string, unknown>[];
/** Field-group specs: the bridge's WriteFieldGroupParam.Fields is also a List<string>. */
export declare function normalizeFieldGroupSpecsForBridge(groups: Record<string, unknown>[]): Record<string, unknown>[];
/**
 * XML Templates for different D365FO object types
 */
export declare class XmlTemplateGenerator {
    /**
     * Split X++ class source into the Declaration block (class header + field
     * declarations) and individual method bodies, as required by D365FO XML.
     *
     * D365FO XML structure:
     *   <Declaration> = class keyword + field declarations (the outer {} block)
     *   <Methods>     = one <Method><Name/><Source/></Method> per method body
     *
     * AI generators often emit the entire source (header + methods) as a single
     * string.  This helper separates them so the generated XML is correct.
     */
    static splitXppClassSource(fullSource: string): {
        declaration: string;
        methods: Array<{
            name: string;
            source: string;
        }>;
    };
    /**
     * Extract methods that are defined INSIDE the class body (depth-1 inside {}).
     *
     * D365FO XML requires each method as a separate <Method><Source/></Method> element.
     * When AI generates a class with methods inside the class braces, all code ends up
     * in <Declaration> with no blank-line separation between methods.
     *
     * This helper detects that pattern and returns the correct split:
     *   declaration = class header + member variable declarations only
     *   methods     = each method body as a separate entry
     *
     * Returns null when no inner methods are found (i.e. the class body is just fields).
     */
    static extractInnerClassMethods(classDeclaration: string): {
        declaration: string;
        methods: Array<{
            name: string;
            source: string;
        }>;
    } | null;
    /**
     * Parse X++ sourceCode into declaration + methods for the C# bridge.
     *
     * Used by the bridge-first creation path in create_d365fo_file — the C# side
     * expects declaration (class header + member vars) and an array of method
     * objects {name, source} which it sets on the AxClass via IMetadataProvider.
     *
     * Delegates to splitXppClassSource after decoding any XML entities.
     */
    static parseSourceForBridge(sourceCode: string): {
        declaration: string;
        methods: {
            name: string;
            source?: string;
        }[];
    };
    /**
     * Generate AxClass XML structure
     */
    static generateAxClassXml(className: string, sourceCode?: string, properties?: Record<string, any>): string;
    /**
     * Generate AxClass XML structure for a Chain of Command (class-extension).
     * The XML format is identical to a regular AxClass — the distinction is purely
     * in the X++ source code ([ExtensionOf(classStr(...))] + final modifier).
     *
     * properties.baseClass   — name of the class being extended (required)
     * properties.modelInfix  — naming infix, e.g. "ContosoExt" → BaseClass_ContosoExt_Extension
     */
    static generateAxClassExtensionXml(extensionName: string, sourceCode?: string, properties?: Record<string, any>): string;
    /**
     * Generate AxTable XML structure (based on real D365FO table structure)
     */
    static generateAxTableXml(tableName: string, properties?: Record<string, any>): string;
    /**
     * Generate AxEnum XML structure
     */
    static generateAxEnumXml(enumName: string, properties?: Record<string, any>): string;
    /**
     * Generate AxForm XML for a new form from a pattern template.
     *
     * Delegates to the pattern-compliant {@link FormPatternTemplates} builders so
     * the generated skeleton actually satisfies the form-pattern gate. The old
     * inline skeleton declared a `<Pattern>` over empty `<Controls />`, which the
     * gate rejected as FP003 (required Grid/ActionPane missing) for every pattern
     * — and worse, defaulted to a `DetailsTransaction` pattern even when the
     * caller asked for a `SimpleList` template, guaranteeing a mismatch block.
     *
     * Pattern resolution: callers may express the intent as either `pattern`
     * (the design pattern) or `formTemplate` (the VS template name); both are
     * fuzzy strings normalized to a canonical pattern. When neither is given we
     * default to SimpleList — the most common shape for a new setup table.
     */
    static generateAxFormXml(formName: string, properties?: Record<string, any>): string;
    /**
     * Generate AxQuery XML structure. Delegates to the shared builder so this
     * cannot drift from generateD365Xml.ts's copy — see queryViewXml.ts for the
     * property contract and why `dataSource` matters.
     */
    static generateAxQueryXml(queryName: string, properties?: Record<string, any>): string;
    /**
     * Generate AxView XML structure. Delegates to the shared builder so this
     * cannot drift from generateD365Xml.ts's copy — see queryViewXml.ts for the
     * property contract and why `query`/`fields` matter.
     */
    static generateAxViewXml(viewName: string, properties?: Record<string, any>): string;
    /**
     * Generate AxMap XML structure. Delegates to the shared builder so this
     * cannot drift from generateD365Xml.ts's copy — see mapXml.ts for the
     * property contract.
     */
    static generateAxMapXml(mapName: string, properties?: Record<string, any>): string;
    /**
     * Generate AxDataEntityView XML structure
     */
    /**
     * Generate AxDataEntityView XML. Delegates to the shared builder so this
     * cannot drift from generateD365Xml.ts's copy (they already had — see
     * dataEntityXml.ts for the property contract and why primaryTable/fields
     * matter).
     */
    static generateAxDataEntityXml(entityName: string, properties?: Record<string, any>): string;
    /**
     * Generate AxReport XML skeleton.
     *
     * properties:
     *   dpClassName   - Data Provider class name          (default: <ReportName>DP)
     *   tmpTableName  - TempDB table name                 (default: <ReportName>Tmp)
     *   datasetName   - AxReportDataSet name              (default: tmpTableName)
     *   designName    - AxReportDesign name               (default: 'Report')
     *   caption       - Design caption label ref           (e.g. '@MyModel:MyLabel')
     *   style         - Design style template             (e.g. 'TableStyleTemplate')
     *   aotQuery      - AOT query name for DynamicParameter (e.g. 'SalesTable')
     *   fields        - Array of { name, alias?, dataType?, caption?, disableAutoCreate? } → AxReportDataSetField
     *   datasets      - Array of { name, dpClassName, tmpTableName, fields?, aotQuery?, contractParams? } for multi-dataset reports
     *   contractParams - Array of { name, dataType?, label?, defaultValue? } → contract class parameters (DataMember)
     *   rdlContent    - Full RDL XML string to embed (auto-generated from fields when omitted)
     *
     * AOT structure generated (mirrors real D365FO reports like ContosoReports_CashOrder_CZ):
     *   <AxReport xmlns="Microsoft.Dynamics.AX.Metadata.V2">
     *     <DataMethods />
     *     <DataSets>
     *       <AxReportDataSet xmlns="">           ← one per dataset
     *         <Fields>…</Fields>
     *         <Parameters>   ← 6 AX system params + {DPCLASS}_DynamicParameter
     *       </AxReportDataSet>
     *     </DataSets>
     *     <DefaultParameterGroup>               ← 6 AX params + DynamicParameter (with AOTQuery+DataType)
     *     <Designs>
     *       <AxReportDesign xmlns="" i:type="AxReportPrecisionDesign">
     *         <Text><![CDATA[…RDL…]]></Text>   ← 2016 schema with DataSources/DataSets/ReportParameters
     *         <DisableIndividualTransformation><Name>…</Name></DisableIndividualTransformation>
     *     </Designs>
     *   </AxReport>
     */
    static generateAxReportXml(reportName: string, properties?: Record<string, any>): string;
    /**
     * Generate XML based on object type
     */
    static generate(objectType: string, objectName: string, sourceCode?: string, properties?: Record<string, any>): string;
    /**
     * Sanitize AxQuery XML — ensures xmlns="" and i:type="AxQuerySimple" are present
     * on the root <AxQuery> element. D365FO deserializer requires both attributes.
     */
    static sanitizeQueryXml(xml: string): string;
    /**
     * Sanitize AxReport XML to guarantee the structural elements required by the D365FO
     * Visual Studio Designer metadata loader, regardless of whether the XML was generated
     * by the template or supplied verbatim by a caller via the xmlContent parameter.
     *
     * Required invariants:
     *  1. xmlns="Microsoft.Dynamics.AX.Metadata.V2" on <AxReport> root
     *  2. <DataMethods /> directly after <Name>…</Name>
     *  3. xmlns="" on every <AxReportDataSet> child element (namespace reset)
     *  4. </AxReport> closing tag present (guard against truncated XML)
     *  5. <AxReportDesign> has xmlns="" and i:type="AxReportPrecisionDesign" attributes
     *     (VS Designer won't show Designs sub-nodes without these)
     */
    /**
     * Sanitize AxEnum XML — fixes common AI-generator mistakes that cause VS2022 to
     * silently ignore enum values or refuse to open the file:
     *
     *  1. <Values>…</Values>  →  <EnumValues>…</EnumValues>
     *     AI models frequently map the JSON `enumValues` array to a plain <Values> wrapper;
     *     D365FO deserializer requires <EnumValues>.
     *
     *  2. <AxEnum> without xmlns:i="http://www.w3.org/2001/XMLSchema-instance"
     *     The attribute is required for the i:type resolution inside the file.
     *
     *  3. More than 251 <AxEnumValue> elements — D365FO compiler hard limit.
     */
    static sanitizeEnumXml(xml: string): string;
    /**
     * Sanitize AxTable XML to ensure correct D365FO field element format.
     *
     * D365FO requires fields as:
     *   <AxTableField xmlns=""
     *     i:type="AxTableFieldString"> ... </AxTableField>
     *
     * AI generators often emit the shorter form:
     *   <AxTableFieldString> ... </AxTableFieldString>
     *
     * This method also ensures <FullTextIndexes /> is present between </Fields> and <Indexes>.
     */
    static sanitizeTableXml(xml: string): string;
    static sanitizeReportXml(xml: string): string;
    /**
     * Convert <Text><![CDATA[…RDL…]]></Text> to XML entity-encoded form.
     *
     * D365FO stores and expects the embedded RDL as entity-encoded text, not CDATA:
     *   <Text>&lt;?xml version="1.0"?&gt;&lt;Report ...&gt;...&lt;/Report&gt;</Text>
     *
     * CDATA is valid XML and semantically equivalent, but the VS Designer metadata loader
     * does not render <Designs> correctly when the <Text> value uses CDATA — the design
     * appears empty even though no parse error is raised. Using entity encoding matches
     * what VS writes natively and fixes the empty-design issue.
     *
     * This is a SEPARATE method from sanitizeReportXml intentionally:
     *   - sanitizeReportXml operates on CDATA form (efficient regex over raw XML text)
     *   - encodeReportTextElement runs AFTER sanitize, just before writing to disk
     */
    static encodeReportTextElement(xml: string): string;
    /**
     * Generate AxEdt XML (Extended Data Type).
     * Default i:type is AxEdtString; override via properties.edtType.
     * Accepts either the full AxEdt* form or a plain base-type name
     * (string → AxEdtString, integer/int → AxEdtInt, int64 → AxEdtInt64,
     *  real → AxEdtReal, date → AxEdtDate, datetime/utcdatetime → AxEdtUtcDateTime,
     *  enum → AxEdtEnum, guid → AxEdtGuid, container → AxEdtContainer).
     */
    static generateAxEdtXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate a minimal extension XML for AxEdtExtension,
     * AxDataEntityViewExtension, AxMenuItemDisplayExtension, AxMenuItemActionExtension,
     * AxMenuItemOutputExtension.
     * Name convention: BaseObjectName.ExtensionName  (e.g. CustTable.MyExtension)
     */
    static generateAxSimpleExtensionXml(rootElement: string, name: string): string;
    /**
     * Generate AxEnumExtension XML.
     * Name convention: BaseEnumName.PrefixExtension
     *
     * Supported properties:
     *   enumValues: Array<{ name, label?, value?, countryRegionCodes?, helpText? }>
     */
    static generateAxEnumExtensionXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate AxTableExtension XML.
     * Name convention: TableName.PrefixExtension
     *
     * Supported properties:
     *   fields:       Array<{ name, edt?, enumType?, label?, mandatory?, fieldType? }>
     *   fieldGroups:  Array<{ name, label?, fields?: string[] }>
     *   fieldGroupExtensions: Array<{ name, fields: string[] }>  — extend base-table field groups
     *   indexes:      Array<{ name, fields: Array<{fieldName, direction?}>, allowDuplicates?, alternateKey? }>
     *   relations:    Array<{ name, relatedTable, constraints: Array<{fieldName, relatedFieldName}>,
     *                         cardinality?, relatedTableCardinality?, relationshipType? }>
     */
    static generateAxTableExtensionXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate AxFormExtension XML.
     * Name convention: FormName.ExtensionName
     */
    static generateAxFormExtensionXml(name: string): string;
    /**
     * Generate AxSecurityPrivilege XML. Delegates to the shared builder so this
     * mirror and the one in generateD365Xml.ts cannot drift.
     * @see buildAxSecurityPrivilegeXml for the property contract and element order.
     */
    static generateAxSecurityPrivilegeXml(name: string, properties?: Record<string, any>): string;
    /**
     * Normalize a name list that may arrive as an array or a comma/semicolon/
     * newline-separated string (models pass either). Returns trimmed, non-empty names.
     */
    static normalizeNameList(value: any): string[];
    /**
     * Render a security reference container: a self-closing tag when empty, or the
     * wrapped child references (e.g. <AxSecurityRolePermissionSet><Name>…</Name></…>).
     */
    private static securityRefContainer;
    /**
     * Generate AxSecurityDuty XML.
     * properties.privileges – privilege names to reference (array or comma-separated).
     */
    static generateAxSecurityDutyXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate AxSecurityRole XML.
     * properties.duties     – duty names to reference (array or comma-separated).
     * properties.privileges – privilege names to reference directly on the role.
     */
    static generateAxSecurityRoleXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate AxSecurityDutyExtension XML — adds privileges to an EXISTING (often
     * Microsoft-owned) duty without overlaying it. Real Microsoft object type, e.g.
     * K:\...\ApplicationCommon\AxSecurityDutyExtension\BatchJobMaintain.ApplicationCommon.xml.
     * Name convention: "<BaseDuty>.<PrefixOrModel>Extension" (same dot-notation as
     * menu-extension / table-extension — see DOT_NOTATION_EXTENSION_TYPES).
     * properties.privileges – privilege names to add to the base duty (array or comma-separated).
     */
    static generateAxSecurityDutyExtensionXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate AxSecurityRoleExtension XML — adds duties and/or privileges to an
     * EXISTING (often Microsoft-owned) role without overlaying it. Real Microsoft
     * object type, e.g. K:\...\ApplicationCommon\AxSecurityRoleExtension\SystemUser.ApplicationCommon.xml.
     * Name convention: "<BaseRole>.<PrefixOrModel>Extension".
     * properties.duties     – duty names to add to the base role (array or comma-separated).
     * properties.privileges – privilege names to add directly to the base role.
     */
    static generateAxSecurityRoleExtensionXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate BusinessEventsContract class XML (AxClass) for a Business Event.
     * The class extends BusinessEventsBase and includes a companion contract class.
     */
    static generateBusinessEventXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate Workspace Tile XML (AxTile).
     * Tiles appear in workspace panorama sections as KPI / navigation tiles.
     */
    static generateAxTileXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate KPI XML (AxKPI).
     * KPIs appear in workspace summary sections.
     */
    static generateAxKpiXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate AxMenu XML.
     */
    static generateAxMenuXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate AxMenuExtension XML.
     * Name convention: MenuName.ExtensionName
     */
    static generateAxMenuExtensionXml(name: string): string;
    /**
     * Generate AxMenuItemDisplay / AxMenuItemAction / AxMenuItemOutput XML.
     *
     * AOT folder mapping:
     *   menu-item-display → AxMenuItemDisplay  (ObjectType: Form)
     *   menu-item-action  → AxMenuItemAction   (ObjectType: Class)
     *   menu-item-output  → AxMenuItemOutput   (ObjectType: Report)
     */
    static generateAxMenuItemXml(itemType: 'menu-item-display' | 'menu-item-action' | 'menu-item-output', name: string, properties?: Record<string, any>): string;
    /**
     * Ensure AxMenuItemAction/Display/Output XML always has the required namespace
     * attributes on the root element.  D365FO metadata deserializer rejects the file
     * without both:
     *   xmlns="Microsoft.Dynamics.AX.Metadata.V1"
     *   xmlns:i="http://www.w3.org/2001/XMLSchema-instance"
     *
     * Also fix invalid ObjectType values:
     *   "Form"   → remove element entirely (display items targeting a form should
     *              omit ObjectType; D365FO has no ObjectType enum value "Form")
     *   "Report" → "SSRSReport" (only valid values are Class / SSRSReport)
     */
    static sanitizeMenuItemXml(xml: string): string;
}
/**
 * Visual Studio Project (.rnrproj) Manipulator
 */
export declare class ProjectFileManager {
    private parser;
    private builder;
    constructor();
    /**
     * Get friendly display folder name for project (used in Folder Include and Link)
     * e.g. class → Classes, enum → Base Enums
     */
    private getFolderName;
    /**
     * Get AOT folder prefix for Content Include path (no .xml extension)
     * e.g. class → AxClass, enum → AxEnum, data-entity → AxDataEntityView
     */
    private getAxFolderPrefix;
    /**
     * Add file reference to Visual Studio project
     * D365FO projects use ABSOLUTE paths to XML files in PackagesLocalDirectory
     * Returns true if file was added, false if file already exists in project
     */
    addToProject(projectPath: string, objectType: string, objectName: string, _absoluteXmlPath: string): Promise<boolean>;
    private _addToProjectLocked;
    /**
     * Add label file entries to Visual Studio project.
     * Each language needs TWO entries:
     *   1. AxLabelFile descriptor:   Include="AxLabelFile\{id}_{lang}"  Link="Label Files\{id}_{lang}"
     *   2. LabelResources .label.txt: Include="{id}.{lang}.label.txt"  DependentUpon="AxLabelFile\{id}_{lang}"
     * Both are added inside a single file-lock + parse/write cycle for efficiency.
     * Returns the list of descriptor names that were newly added.
     */
    addLabelToProject(projectPath: string, labelFileId: string, languages: string[]): Promise<string[]>;
    private _addLabelToProjectLocked;
    /**
     * Extract ModelName from Visual Studio project file
     * Returns the actual model name from PropertyGroup/Model or PropertyGroup/ModelName
     */
    extractModelName(projectPath: string): Promise<string | null>;
}
/**
 * Create D365FO file handler function
 */
export declare function handleCreateD365File(request: CallToolRequest, context?: {
    bridge?: import('../bridge/bridgeClient.js').BridgeClient;
    symbolIndex?: import('../metadata/symbolIndex.js').XppSymbolIndex;
}): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=createD365File.d.ts.map