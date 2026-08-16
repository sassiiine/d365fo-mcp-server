/**
 * D365FO XML Generator Tool
 * Generates D365FO XML content for classes, tables, enums, etc.
 * Returns XML as text - user/Copilot creates the physical file
 * Works remotely through Azure (no file system access needed)
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { type AxMenuItemExtensionRootElement } from './menuItemExtensionXml.js';
/**
 * XML Template Generator for D365FO Objects
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
     * Extract methods defined INSIDE the class body (depth-1 inside {}).
     * Mirror of the same method in createD365File.ts — kept in sync manually.
     */
    static extractInnerClassMethods(classDeclaration: string): {
        declaration: string;
        methods: Array<{
            name: string;
            source: string;
        }>;
    } | null;
    /**
     * Generate AxClass XML structure
     */
    static generateAxClassXml(className: string, sourceCode?: string, properties?: Record<string, any>): string;
    /**
     * Generate AxTable XML structure
     */
    static generateAxTableXml(tableName: string, properties?: Record<string, any>): string;
    /**
     * Generate AxEnum XML structure
     */
    static generateAxEnumXml(enumName: string, properties?: Record<string, any>): string;
    /**
     * Generate AxForm XML structure
     */
    static generateAxFormXml(formName: string, properties?: Record<string, any>): string;
    /**
     * Generate AxQuery XML structure. Delegates to the shared builder
     * (queryViewXml.ts) so this cannot drift from createD365File.ts's copy.
     */
    static generateAxQueryXml(queryName: string, properties?: Record<string, any>): string;
    /**
     * Generate AxView XML structure. Delegates to the shared builder
     * (queryViewXml.ts) so this cannot drift from createD365File.ts's copy.
     */
    static generateAxViewXml(viewName: string, properties?: Record<string, any>): string;
    /**
     * Generate AxMap XML structure. Delegates to the shared builder (mapXml.ts)
     * so this cannot drift from createD365File.ts's copy.
     */
    static generateAxMapXml(mapName: string, properties?: Record<string, any>): string;
    /**
     * Generate AxDataEntityView XML structure. Delegates to the shared builder
     * (dataEntityXml.ts) so this cannot drift from createD365File.ts's copy.
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
     * Main generate method
     */
    static generate(objectType: string, objectName: string, sourceCode?: string, properties?: Record<string, any>): string;
    static generateAxEdtXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate AxEdtExtension XML. Delegates to the shared builder so this cannot
     * drift from createD365File.ts's copy — see edtExtensionXml.ts for the property
     * contract and why <ArrayElements /> is unconditional.
     */
    static generateAxEdtExtensionXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate AxDataEntityViewExtension XML. Delegates to the shared builder so
     * this cannot drift from createD365File.ts's copy — see
     * dataEntityViewExtensionXml.ts for the property contract.
     */
    static generateAxDataEntityViewExtensionXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate AxMenuItem{Display,Action,Output}Extension XML. Delegates to the
     * shared builder so this cannot drift from createD365File.ts's copy — see
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
    static generateAxTableExtensionXml(name: string, properties?: Record<string, any>): string;
    static generateAxFormExtensionXml(name: string): string;
    static generateAxMenuItemXml(itemType: string, name: string, properties?: Record<string, any>): string;
    static generateAxMenuXml(name: string, properties?: Record<string, any>): string;
    static generateAxMenuExtensionXml(name: string): string;
    static generateAxSecurityPrivilegeXml(name: string, properties?: Record<string, any>): string;
    static generateAxSecurityDutyXml(name: string, properties?: Record<string, any>): string;
    static generateAxSecurityRoleXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate AxSecurityDutyExtension XML — adds privileges to an EXISTING duty
     * without overlaying it. Name convention: "<BaseDuty>.<PrefixOrModel>Extension".
     */
    static generateAxSecurityDutyExtensionXml(name: string, properties?: Record<string, any>): string;
    /**
     * Generate AxSecurityRoleExtension XML — adds duties/privileges to an EXISTING
     * role without overlaying it. Name convention: "<BaseRole>.<PrefixOrModel>Extension".
     */
    static generateAxSecurityRoleExtensionXml(name: string, properties?: Record<string, any>): string;
}
export declare function handleGenerateD365Xml(request: CallToolRequest): Promise<any>;
//# sourceMappingURL=generateD365Xml.d.ts.map