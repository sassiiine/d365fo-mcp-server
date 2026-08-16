/**
 * Form Pattern Validator — pure structural validator for AxForm XML against
 * the curated form pattern catalog (src/knowledge/formPatterns).
 *
 * Rules:
 *   FP001 (error)   unknown <Pattern> on Design / unknown sub-pattern on a container
 *   FP002 (error)   unknown PatternVersion for a known pattern
 *         (warning) known-but-older version, or version newer than catalog (PU drift)
 *   FP003 (error)   required node missing (e.g. SimpleList without a Grid)
 *   FP004 (error)   child control type not allowed in a patterned container
 *   FP005 (error)   required children out of order (e.g. Grid before ActionPane)
 *   FP006 (warning) container that requires a sub-pattern has none ("unspecified")
 *   FP007 (error)   sub-pattern applied to an unsupported control type / parent pattern,
 *                   or not allowed at this slot of the parent pattern
 *   FP008 (warning) datasource expectation unmet (count / TitleDataSource)
 *   FP009 (warning) Design/control property differs from the pattern default
 *   FP010 (warning) no <Pattern> declared on Design at all
 *
 * Severity policy: only structural rules (FP001-FP005, FP007) are errors and
 * may block writes; the rest are recommendations.
 */
import { type FormDesignInfo } from '../metadata/formPatternMiner.js';
export interface FormPatternViolation {
    rule: string;
    severity: 'error' | 'warning';
    /** Tree path, e.g. 'Design/Tab[TabHeader]/TabPage[General]' */
    path: string;
    excerpt: string;
    fix: string;
}
export interface FormPatternReport {
    formName?: string;
    pattern?: string;
    patternVersion?: string;
    violations: FormPatternViolation[];
    coverage: {
        containersTotal: number;
        containersPatterned: number;
    };
}
interface FormFacts {
    design: FormDesignInfo;
    dataSourceCount: number;
    formName?: string;
}
/** Validate an already-walked design tree (used by tests and the miner path). */
export declare function validateFormTree(facts: FormFacts): FormPatternReport;
/** Parse AxForm XML and validate it against the catalog. */
export declare function validateFormPatternXml(xml: string): Promise<FormPatternReport>;
/** True when the report contains error-severity violations. */
export declare function hasPatternErrors(report: FormPatternReport): boolean;
export {};
//# sourceMappingURL=formPatternValidator.d.ts.map