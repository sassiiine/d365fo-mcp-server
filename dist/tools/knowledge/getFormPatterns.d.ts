/**
 * Get Form Patterns Tool
 * Analyzes common datasource configurations, control hierarchies, and form patterns
 * Used for smart form generation
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { XppServerContext } from '../../types/context.js';
import { type FormPatternSpec } from '../../knowledge/formPatterns/index.js';
declare const RecommendSchema: z.ZodObject<{
    entityKind: z.ZodOptional<z.ZodEnum<{
        dialogTask: "dialogTask";
        inquiry: "inquiry";
        lookup: "lookup";
        master: "master";
        parameters: "parameters";
        setup: "setup";
        transaction: "transaction";
        workspace: "workspace";
    }>>;
    hasHeaderLines: z.ZodOptional<z.ZodBoolean>;
    fieldCount: z.ZodOptional<z.ZodNumber>;
    usageIntent: z.ZodOptional<z.ZodEnum<{
        dashboard: "dashboard";
        maintain: "maintain";
        pickValue: "pickValue";
        quickCreate: "quickCreate";
        viewOnly: "viewOnly";
        wizard: "wizard";
    }>>;
    tableName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type RecommendInput = z.infer<typeof RecommendSchema>;
export interface PatternRecommendation {
    spec: FormPatternSpec;
    reasons: string[];
    /** Lower-ranked alternatives worth considering */
    alternatives: Array<{
        spec: FormPatternSpec;
        why: string;
    }>;
}
/**
 * Microsoft form-pattern decision tree (select-form-pattern guidance) over the
 * curated catalog. Pure function — index evidence is attached by the caller.
 */
export declare function recommendPattern(input: RecommendInput): PatternRecommendation;
export declare function handleGetFormPatterns(args: {
    formPattern?: string;
    dataSource?: string;
    tableName?: string;
    limit?: number;
}, symbolIndex: any): Promise<any>;
export declare function getFormPatternsTool(request: CallToolRequest, context: XppServerContext): Promise<{
    isError?: undefined;
    content: {
        type: string;
        text: string;
    }[];
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
export {};
//# sourceMappingURL=getFormPatterns.d.ts.map