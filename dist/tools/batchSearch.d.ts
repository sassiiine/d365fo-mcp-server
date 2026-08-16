/**
 * Batch Search Tool - Priority 3 Optimization
 *
 * Allows AI agents to parallelize independent search queries in a single HTTP request.
 * Reduces round-trip overhead and enables concurrent search execution.
 *
 * Expected Impact:
 * - 3 HTTP requests → 1 HTTP request (3x faster)
 * - Enable 40% of searches to be parallelized
 * - Reduce total workflow time for exploratory searches
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { XppServerContext } from '../types/context.js';
/**
 * Schema for batch search request
 */
export declare const BatchSearchArgsSchema: z.ZodObject<{
    queries: z.ZodArray<z.ZodObject<{
        query: z.ZodString;
        type: z.ZodOptional<z.ZodEnum<{
            view: "view";
            class: "class";
            table: "table";
            form: "form";
            query: "query";
            method: "method";
            field: "field";
            enum: "enum";
            edt: "edt";
            report: "report";
            "security-privilege": "security-privilege";
            "security-duty": "security-duty";
            "security-role": "security-role";
            "menu-item-display": "menu-item-display";
            "menu-item-action": "menu-item-action";
            "menu-item-output": "menu-item-output";
            "table-extension": "table-extension";
            "class-extension": "class-extension";
            "form-extension": "form-extension";
            "enum-extension": "enum-extension";
            "edt-extension": "edt-extension";
            "data-entity-extension": "data-entity-extension";
            all: "all";
        }>>;
        limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        workspacePath: z.ZodOptional<z.ZodString>;
        includeWorkspace: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    }, z.core.$strip>>;
    globalTypeFilter: z.ZodOptional<z.ZodArray<z.ZodString>>;
    deduplicate: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    crossReference: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
/**
 * Batch Search Tool Handler
 */
export declare function batchSearchTool(request: CallToolRequest, context: XppServerContext): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=batchSearch.d.ts.map