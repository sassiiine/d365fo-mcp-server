/**
 * D365FO File Creator Tool
 * Creates physical XML files in the AOT package structure
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { type AxMenuItemExtensionRootElement } from '../xml/menuItemExtensionXml.js';
/**
 * Normalize the flexible field specs accepted by the tool / XML generators
 * (`{ name, edt?, type?, fieldType?, extendedDataType?, enumType?, mandatory?, label? }`)
 * into the key shape the C# bridge's WriteFieldParam actually deserializes.
 *
 * The bridge only reads JSON keys `type` and `edt` (`[JsonPropertyName]`), not
 * `fieldType`/`extendedDataType` — accept either input spelling and always emit
 * the bridge's keys. `type` may arrive as a base-type keyword ("Integer") or a
 * full i:type ("AxTableFieldInt"); the latter is stripped back to the keyword
 * the bridge's CreateTableField switch understands.
 */
export declare function normalizeFieldSpecsForBridge(fields: Record<string, unknown>[]): Record<string, unknown>[];
/**
 * Normalize the flexible index specs accepted by the tool into the key shape the
 * C# bridge's WriteIndexParam actually deserializes: `{ name, fields: string[],
 * alternateKey?, allowDuplicates? }`.
 *
 * Accepts both the bridge's native `{name, fields}` shape and the documented
 * `modify(operation="add-index")` shape `{indexName, indexFields: [{fieldName}]}`.
 * Unrecognized keys are silently ignored by System.Text.Json, so any unmapped
 * shape produces an index with an empty Name/Fields that xppc rejects at build time.
 */
export declare function normalizeIndexSpecsForBridge(indexes: Record<string, unknown>[]): Record<string, unknown>[];
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
     * If `declaration`'s own `class`/`interface` header names something other than
     * `className` (e.g. the object is being created as "ContosoFoo" but the caller's
     * X++ still says `class Foo`), rename every self-reference to that stale name —
     * in the header AND in every method body (constructor calls, return types,
     * etc.) — to `className`.
     *
     * Left unfixed, the AOT object's `<Name>` (which the create path always sets to
     * the resolved `className`, independent of whatever the caller typed in
     * `sourceCode`) does not match its own X++ class keyword — a hard xppc build
     * error ("class must be named the same as the object it is contained in"),
     * confirmed by corpus evidence: the caller passed an already-correct,
     * fully-resolved objectName ("ContosoXyzNoteFormatter") — so the existing
     * objectName-vs-finalObjectName prefix-mismatch guard below never fired — while
     * sourceCode's `class XyzNoteFormatter` used the bare, unprefixed name
     * (eval/corpus/runs/2026-07-06T16__L1-class-basic__73707ff.json).
     */
    static normalizeSelfReferenceName<T extends {
        name: string;
        source?: string;
    }>(className: string, declaration: string, methods: T[]): {
        declaration: string;
        methods: T[];
    };
    /**
     * Parse X++ sourceCode into declaration + methods for the C# bridge.
     *
     * Used by the bridge-first creation path in create_d365fo_file — the C# side
     * expects declaration (class header + member vars) and an array of method
     * objects {name, source} which it sets on the AxClass via IMetadataProvider.
     *
     * Delegates to splitXppClassSource after decoding any XML entities.
     *
     * `className` is the resolved AOT object name the bridge will create this
     * class under (`finalObjectName`) — passing it lets self-references in the
     * caller's sourceCode that don't match get corrected (normalizeSelfReferenceName).
     */
    static parseSourceForBridge(sourceCode: string, className?: string): {
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
    static generateAxTableXml(tableName: string, properties?: Record<string, any>, sourceCode?: string): string;
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
     * Extension XML. Name convention throughout: BaseObjectName.ExtensionName
     * (e.g. CustTable.ConExtension). Each of these delegates to a shared builder so
     * this class cannot drift from generateD365Xml.ts's mirrored copy.
     */
    /**
     * Generate AxEdtExtension XML — see edtExtensionXml.ts for the property
     * contract and why <ArrayElements /> is unconditional.
     */
    static generateAxEdtExtensionXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate AxDataEntityViewExtension XML — see dataEntityViewExtensionXml.ts
     * for the fields / fieldGroupExtensions / propertyModifications contract.
     */
    static generateAxDataEntityViewExtensionXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate AxMenuItem{Display,Action,Output}Extension XML — see
     * menuItemExtensionXml.ts for the property-modification contract.
     */
    static generateAxMenuItemExtensionXml(rootElement: AxMenuItemExtensionRootElement, name: string, properties?: Record<string, any>): string;
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
     *   indexes:      Array<{ name, fields: Array<string | {fieldName, direction?}>, allowDuplicates?, alternateKey? }>
     *   relations:    Array<{ name, relatedTable,
     *                         constraints: Array<{fieldName|field, relatedFieldName|relatedField}>,
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
     * Generate macro-library XML (AxMacroDictionary).
     *
     * The whole library body is ONE property (`Source`) — there is no per-macro
     * sub-element in the metadata, so the caller's sourceCode is emitted verbatim
     * (XML-escaped) exactly the way the platform's own flight libraries do it.
     *
     * Line breaks are written as CRLF with the CR escaped (`&#xD;` + newline),
     * which is what the MS serializer emits (see ApplicationFoundationFlights.xml).
     * A literal CRLF also compiles — an XML parser normalises it to LF — but it
     * does not round-trip: the CR is lost on re-serialization, so a golden frozen
     * on the unescaped form would churn the first time the element is rewritten
     * by Visual Studio. Verified on the VM by L1-macro-library-flight.
     */
    static generateAxMacroXml(name: string, sourceCode?: string, properties?: Record<string, any>): string;
    /**
     * Generate configuration-key XML (AxConfigurationKey).
     * ParentKey nests the key under an existing one; LicenseCode ties it to an
     * ISV licence (both optional — an omitted element means "no parent/licence").
     */
    static generateAxConfigurationKeyXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate XDS security-policy XML (AxSecurityPolicy).
     * A policy constrains PrimaryTable through Query; every constrained table is
     * an AxSecurityPolicyConstrainedTable entry carrying its TableRelation.
     */
    static generateAxSecurityPolicyXml(name: string, properties?: Record<string, any>): string;
    /**
     * The aggregation of an <AxMeasure>, as the contract actually spells it.
     *
     * The element is <DefaultAggregate> — `AggregateFunction` appears NOWHERE in
     * PackagesLocalDirectory, and an unknown child element is DROPPED SILENTLY by
     * the deserializer: the L3-aggregate-measurement-basic run built green while
     * the measure fell back to Sum, with nothing anywhere reporting the loss.
     *
     * The enum is not the SQL vocabulary either — the platform's 531 measures use
     * only Sum (495), DistinctCount (23), AverageOfChildren (10), Max (2), Min (1).
     * "Avg" and "Count" are accepted as aliases because that is what a caller
     * (and every BI doc) reaches for; anything else is refused rather than written
     * out to be dropped.
     */
    static resolveDefaultAggregate(value: string | undefined, measureName: string): string;
    /**
     * Generate aggregate-measurement XML (AxAggregateMeasurement).
     * One measure group per fact table/entity: Attributes are the slicing keys,
     * Measures the aggregated fields (see resolveDefaultAggregate for the enum).
     */
    static generateAxAggregateMeasurementXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate license-code XML (AxLicenseCode) — the ISV licensing anchor a
     * configuration key points at through its LicenseCode property.
     */
    static generateAxLicenseCodeXml(name: string, properties?: Record<string, any>): string;
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
 * Resolve the `values` / `enumValues` alias ONCE, before anything routes on it.
 *
 * `values` is a legacy spelling the bridge create path has always accepted
 * (`props.enumValues ?? props.values` → bridgeParams.values), but the TypeScript
 * XML generator reads `properties.enumValues` and nothing else. Two writers
 * disagreeing about the same payload is only harmless while both of them run;
 * they don't. An enum passed `values: [None=0, A=1]` routes AWAY from the bridge
 * (the resolved mode forbids explicit <Value> elements — see
 * enumModeForbidsExplicitValues below) and lands on the generator, which finds no
 * `enumValues`, writes `<EnumValues />`, and reports a clean ✅ for an enum with no
 * values at all.
 *
 * So normalise here, at the top of the handler, where every later reader — routing
 * predicate, bridge params, generator — sees the same list. Mutates in place: `args`
 * is this call's own parsed object.
 */
export declare function normalizeEnumValuesAlias(objectType: string, properties: Record<string, unknown> | undefined): void;
/**
 * The caller's X++ as this server actually wrote it.
 *
 * Every create path renames a class/interface whose declared name differs from
 * the resolved object name, and that rename is usually what makes the name
 * legal. Linting the caller's own text instead reports the pre-rename name —
 * a naming violation against a name already fixed on disk.
 *
 * Delegates to the helper the writers use, so the two cannot drift. Source with
 * no class/interface header is returned untouched.
 */
export declare function sourceAsWritten(sourceCode: string | undefined, finalObjectName: string): string | undefined;
/**
 * Create D365FO file handler function
 */
export declare function handleCreateD365File(request: CallToolRequest, context?: {
    bridge?: import('../../bridge/bridgeClient.js').BridgeClient;
    symbolIndex?: import('../../metadata/symbolIndex.js').XppSymbolIndex;
}): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=createD365File.d.ts.map