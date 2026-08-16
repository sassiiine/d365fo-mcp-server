/**
 * Live inputs for the coverage matrix.
 *
 * Kept apart from the CLI so tests can build the same report without the CLI's
 * process.exit, and apart from coverage.ts so that module stays pure.
 */
import { type EvalCaseSummary, type CoverageReport } from './coverage.js';
export declare const REPO_ROOT: string;
export declare const CASES_DIR: string;
export declare const MD_PATH: string;
export declare const JSON_PATH: string;
export declare const README_PATH: string;
export declare function loadCases(dir?: string): EvalCaseSummary[];
/** Object types the MCP surface can actually create — the T flag's source. */
export declare function toolObjectTypes(): Set<string>;
export declare function buildReport(): CoverageReport;
//# sourceMappingURL=sources.d.ts.map