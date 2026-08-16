/**
 * Generate Smart Form Tool
 * AI-driven form generation using indexed metadata patterns
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { XppSymbolIndex } from '../metadata/symbolIndex.js';
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