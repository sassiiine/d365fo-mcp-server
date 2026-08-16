/**
 * Generate Smart Form Tool
 * AI-driven form generation using indexed metadata patterns
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { XppSymbolIndex } from '../../metadata/symbolIndex.js';
interface GenerateSmartFormArgs {
    name: string;
    label?: string;
    caption?: string;
    dataSource?: string;
    linesTable?: string;
    linesDataSource?: string;
    formPattern?: string;
    copyFrom?: string;
    cloneFrom?: string;
    tableMapping?: Record<string, string>;
    includeMethodStubs?: boolean;
    generateControls?: boolean;
    modelName?: string;
    projectPath?: string;
    solutionPath?: string;
}
export declare const generateSmartFormTool: Tool;
/**
 * Default Design/Caption for a scaffolded form (pure — no DB access).
 *
 * Regression (eval/corpus/runs/2026-07-06T17__L1-form-listpage__cb1b73d.json,
 * cross-referenced by L1-form-dialog and L1-form-lookup — "a systemic
 * scaffold default, not a one-off"): when neither an explicit `caption` nor
 * `label` argument was given, the caption defaulted to the raw object name
 * (e.g. "PFXDemoNoteHeaderListPage") instead of reusing the bound
 * datasource table's own Label — even though that Label is resolvable via
 * the bridge/symbol index and is exactly the value real D365FO forms use
 * (raw-text captions also trip BPErrorLabelIsText and cascade into
 * BPErrorCaptionNotDefined on unlabeled ActionPane/ButtonGroups). Reusing
 * the bound table's Label when available is both more correct and BP-clean.
 */
export declare function resolveFormCaption(explicitCaption: string | undefined, explicitLabel: string | undefined, tableLabel: string | undefined, fallbackName: string): string;
/**
 * Look up a table's own Label reference (e.g. "@TaxTransactionInquiry:HeaderNote")
 * from the symbol index, for use as a scaffolded form's default caption. Returns
 * undefined when the table is unindexed or has no Label recorded — callers fall
 * back to `label`/the raw object name via `resolveFormCaption`.
 */
export declare function lookupTableLabel(symbolIndex: XppSymbolIndex, table: string | undefined): string | undefined;
/**
 * Pre-write check for cloneFrom: cloning copies the reference form's control
 * hierarchy and sub-patterns verbatim. If the caller asked for a different
 * pattern than the reference declares, the result will likely violate the
 * requested pattern (e.g. SimpleListDetails forbids a Tab the source carried)
 * and be rejected by the form-pattern validator. Returns a warning line when the
 * cloned form's declared <Pattern> differs from the requested pattern, or null
 * when they match / either can't be determined.
 */
export declare function cloneFromPatternMismatchWarning(requestedPattern: string | undefined, clonedXml: string, sourceFormName: string): string | null;
/**
 * Pre-clone table-mapping coverage check (pure — no DB/fs access).
 *
 * `getTableFields(table)` must return the field-name list for a table, or `null`
 * when the table is unknown to the caller (e.g. not yet in the symbol index).
 * Two independent failure classes, checked separately:
 *   - unknownTargets: the MAPPED target table has no known fields at all — cloning
 *     cannot verify overlap, and (per cloneFormXml's own "unknown table → keep
 *     fields" fallback) would silently leave that datasource bound to the SOURCE
 *     table's fields instead of failing. Always worth surfacing loudly.
 *   - poorOverlap: both tables are known, but share too few fields (<30%) for the
 *     clone to be structurally meaningful.
 * Source tables with <3 known fields are skipped (too little signal either way).
 */
export declare function checkTableMappingCoverage(tableMapping: Record<string, string>, getTableFields: (table: string) => string[] | null): {
    unknownTargets: string[];
    poorOverlap: string[];
};
export declare function handleGenerateSmartForm(args: GenerateSmartFormArgs, symbolIndex: XppSymbolIndex): Promise<any>;
/**
 * The most common Design-level PatternVersion this environment uses for a form
 * pattern, from mined form_patterns data. Returns null when no mined data exists.
 */
export declare function resolveEnvPatternVersion(db: any, patternXmlName: string): string | null;
export {};
//# sourceMappingURL=generateSmartForm.d.ts.map