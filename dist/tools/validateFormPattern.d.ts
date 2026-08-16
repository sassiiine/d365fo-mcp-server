/**
 * validate_form_pattern — structural validator for AxForm XML against the
 * curated D365FO form pattern catalog (src/knowledge/formPatterns).
 *
 * Validates control hierarchy, ordering, sub-pattern usage, pattern versions
 * and datasource expectations. Rules FP001-FP010 (see
 * src/validation/formPatternValidator.ts). Errors block form writes in
 * create_d365fo_file when FORM_PATTERN_ENFORCE is enabled (default: true).
 */
import { z } from 'zod';
export declare const validateFormPatternArgsSchema: z.ZodObject<{
    xml: z.ZodOptional<z.ZodString>;
    formName: z.ZodOptional<z.ZodString>;
    filePath: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function validateFormPatternTool(request: any, context?: {
    symbolIndex?: any;
}): Promise<any>;
/** FORM_PATTERN_ENFORCE defaults to enabled; set to 'false'/'0' to disable blocking. */
export declare function isFormPatternEnforceEnabled(): boolean;
/** Result of the add-control pre-flight check */
export interface AddControlPatternVerdict {
    /** Sub-pattern declared on the parent container */
    parentPattern: string;
    allowed: boolean;
    allowedTypes: string[] | 'any';
}
/**
 * Pre-flight for modify_d365fo_file(add-control): when the target parent
 * container declares a sub-pattern, check the new control's type against the
 * children that sub-pattern allows. Returns null when the parent cannot be
 * found, declares no pattern, or the pattern is unknown — those cases never
 * block (the compiler / post-validation catches real issues).
 */
export declare function checkAddControlAgainstParentPattern(baseFormXml: string, parentControlName: string, controlType: string): Promise<AddControlPatternVerdict | null>;
/**
 * Gate a form write on pattern errors. Returns an MCP error result when the
 * XML has error-severity pattern violations and enforcement is enabled;
 * returns null (optionally with warnings text) when the write may proceed.
 */
export declare function gateOnFormPatternErrors(xmlContent: string, operationDescription: string): Promise<{
    blocked: {
        isError: true;
        content: Array<{
            type: 'text';
            text: string;
        }>;
    } | null;
    warningsText: string | null;
}>;
//# sourceMappingURL=validateFormPattern.d.ts.map