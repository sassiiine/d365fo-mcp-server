/**
 * Batch Get Info Tool
 *
 * Fetches detailed metadata for N objects in a single request — the read-side
 * counterpart of batch_search. Each object dispatches to its existing
 * get_*_info tool and all lookups run in parallel (same pattern as
 * prepare_change), eliminating one round trip per object.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import type { XppServerContext } from '../types/context.js';
export declare const BatchGetInfoArgsSchema: z.ZodObject<{
    objects: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodEnum<{
            view: "view";
            "data-entity": "data-entity";
            class: "class";
            table: "table";
            form: "form";
            query: "query";
            enum: "enum";
            edt: "edt";
            report: "report";
            "security-privilege": "security-privilege";
            "security-duty": "security-duty";
            "security-role": "security-role";
            "table-extension": "table-extension";
            "class-extension": "class-extension";
            "form-extension": "form-extension";
            "enum-extension": "enum-extension";
            "edt-extension": "edt-extension";
            "data-entity-extension": "data-entity-extension";
            service: "service";
            map: "map";
            "security-policy": "security-policy";
            macro: "macro";
            "menu-item": "menu-item";
            "config-key": "config-key";
        }>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export declare function batchGetInfoTool(request: CallToolRequest, context: XppServerContext): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=batchGetInfo.d.ts.map