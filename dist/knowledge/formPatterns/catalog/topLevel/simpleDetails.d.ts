/**
 * Simple Details form pattern class (4 variants) — focused on a single record.
 * https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/user-interface/simple-details-form-pattern
 */
import type { FormPatternSpec } from '../../types.js';
export declare const simpleDetailsToolbarFields: FormPatternSpec;
export declare const simpleDetailsFastTabs: FormPatternSpec;
export declare const simpleDetailsStandardTabs: FormPatternSpec;
export declare const simpleDetailsPanorama: FormPatternSpec;
export declare const simpleDetailsPatterns: FormPatternSpec[];
/**
 * Sentinel entry for forms marked as Custom — no standard pattern is enforced.
 * Prevents FP001 false-positives; not a prescriptive recommendation.
 */
export declare const customPattern: FormPatternSpec;
//# sourceMappingURL=simpleDetails.d.ts.map