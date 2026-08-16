/**
 * get_form_pattern_spec — expose the curated form-pattern catalog to AI
 * clients: structure tree (required containers, ordering, allowed
 * sub-patterns), when to use, reference forms, lifecycle guidance.
 */
import { z } from 'zod';
export declare const getFormPatternSpecArgsSchema: z.ZodObject<{
    pattern: z.ZodString;
}, z.core.$strip>;
export declare function getFormPatternSpecTool(request: any, context?: {
    symbolIndex?: any;
}): Promise<any>;
//# sourceMappingURL=getFormPatternSpec.d.ts.map