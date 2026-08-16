/**
 * Batch Search Tool
 *
 * Allows AI agents to parallelize independent search queries in a single HTTP request.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { XppServerContext } from '../../types/context.js';
/**
 * Schema for batch search request
 */
export declare const BatchSearchArgsSchema: z.ZodObject<{
    queries: z.ZodArray<z.ZodObject<{
        query: z.ZodString;
        type: z.ZodOptional<z.ZodEnum<{
            all: "all";
            class: "class";
            "class-extension": "class-extension";
            "data-entity-extension": "data-entity-extension";
            edt: "edt";
            "edt-extension": "edt-extension";
            enum: "enum";
            "enum-extension": "enum-extension";
            field: "field";
            form: "form";
            "form-extension": "form-extension";
            "menu-item-action": "menu-item-action";
            "menu-item-display": "menu-item-display";
            "menu-item-output": "menu-item-output";
            method: "method";
            query: "query";
            report: "report";
            "security-duty": "security-duty";
            "security-privilege": "security-privilege";
            "security-role": "security-role";
            table: "table";
            "table-extension": "table-extension";
            view: "view";
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
//# sourceMappingURL=batchSearch.d.ts.map