/**
 * Generate Smart Report Tool
 * AI-driven SSRS report generation using indexed metadata patterns.
 *
 * Generates up to 7+ D365FO objects in a single call:
 *   1. TmpTable(s) (AxTable, TableType=TempDB) — holds report rows; extras for additionalDatasets
 *   2. Contract class (DataContractAttribute) — dialog parameters, optional validate()
 *   3. DP class (SrsReportDataProviderBase/PreProcess) — fills TmpTable, query-based or manual
 *   4. Controller class (SrsReportRunController/SrsPrintMgmtController) — optional
 *   5. Output menu item (AxMenuItemOutput) — generated together with Controller
 *   6. Report (AxReport + RDL) — multi-dataset, page header, optional GroupedWithTotals tablix
 *
 * Architecture follows generate_smart_table / generate_smart_form patterns:
 *   - Exported Tool definition + async handler
 *   - Symbol index queries for EDT resolution, copyFrom, patterns
 *   - Dual-path output: Azure/Linux returns XML/source text; Windows writes + adds to project
 *
 * References:
 *   - "Microsoft Dynamics AX 2012 Reporting Cookbook" (chapters 2–4)
 *   - D365FO SSRS best practices: Contract–DP–Controller trio
 *   - XmlTemplateGenerator.generateAxReportXml() for AxReport XML skeleton
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { XppSymbolIndex } from '../../metadata/symbolIndex.js';
import type { BridgeClient } from '../../bridge/bridgeClient.js';
interface ReportFieldSpec {
    /** Field name on the TmpTable (e.g. "ItemId", "Amount") */
    name: string;
    /** EDT to use (auto-suggested from name when omitted) */
    edt?: string;
    /** .NET data type for RDL (auto-resolved from EDT when omitted) */
    dataType?: string;
    /** Label ref for column caption (e.g. "@SYS12345") */
    label?: string;
}
interface ContractParamSpec {
    /** Parameter name (becomes parm method on Contract class) */
    name: string;
    /** X++ type — EDT name or primitive (e.g. "CustAccount", "TransDate", "str") */
    type?: string;
    /** Label for dialog prompt */
    label?: string;
    /** Default value expression (X++ literal, e.g. `DateTimeUtil::getSystemDateTime()`) */
    defaultValue?: string;
    /** Whether this parameter is mandatory (generates validation in Contract) */
    mandatory?: boolean;
}
interface GenerateSmartReportArgs {
    /** Base report name (prefix applied automatically from model) */
    name: string;
    /** Human-readable caption / label for the report (used in RDL title + menu item) */
    caption?: string;
    /** Comma-separated field hints for the TmpTable (like fieldsHint in generate_smart_table) */
    fieldsHint?: string;
    /** Structured field specs (takes priority over fieldsHint when both provided) */
    fields?: ReportFieldSpec[];
    /** Contract class dialog parameters */
    contractParams?: ContractParamSpec[];
    /** Whether to generate a Controller class (default: true) */
    generateController?: boolean;
    /** RDL design style: SimpleList (default), GroupedWithTotals */
    designStyle?: string;
    /** Copy structure from an existing report (reads fields from its DP's TmpTable) */
    copyFrom?: string;
    /** AOT query name — when provided, DP uses query-based processReport() via this.parmQuery() */
    aotQuery?: string;
    /** Table name of the caller record (e.g. "CustTable") — generates parmArgs() pre-fill in Controller prePromptModifyContract() */
    callerTableName?: string;
    /** When true, DP extends SrsReportDataProviderPreProcess instead of SrsReportDataProviderBase */
    preProcess?: boolean;
    /** Controller variant: "simple" (SrsReportRunController) or "printMgmt" (SrsPrintMgmtController) */
    controllerType?: 'simple' | 'printMgmt';
    /** Additional datasets — each generates an extra TmpTable (TempDB) and a get<Table>() method in the DP */
    additionalDatasets?: Array<{
        name: string;
        fieldsHint?: string;
        fields?: ReportFieldSpec[];
    }>;
    /** Model name (auto-detected from projectPath) */
    modelName?: string;
    /** Path to .rnrproj file */
    projectPath?: string;
    /** Path to solution directory */
    solutionPath?: string;
    /** Base packages directory path */
    packagePath?: string;
}
export declare const generateSmartReportTool: Tool;
export declare function handleGenerateSmartReport(args: GenerateSmartReportArgs, symbolIndex: XppSymbolIndex, bridge?: BridgeClient): Promise<any>;
export {};
//# sourceMappingURL=generateSmartReport.d.ts.map