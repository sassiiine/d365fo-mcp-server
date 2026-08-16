/**
 * prepare_create — single-round context aggregator for NEW D365FO objects.
 *
 * Mirror of prepare_change for object creation: one call replaces the
 * search → validate_object_naming → suggest_edt → labels → patterns
 * sequence (4–6 agentic rounds) with a single parallel query bundle:
 *   - name collision check (exact + prefix variants) against the symbol index
 *   - naming validation incl. the prefix the write tool will actually apply
 *   - similar existing objects to copy patterns from
 *   - EDT suggestions for planned table fields (edt_metadata + symbols)
 *   - reusable existing labels matching the object name
 *   - mined property defaults from property_stats (what standard models set)
 *   - grounding token (object-bound, 30-min TTL)
 */
import { z } from 'zod';
import type { XppServerContext } from '../types/context.js';
export declare const prepareCreateArgsSchema: z.ZodObject<{
    goal: z.ZodString;
    objectName: z.ZodString;
    objectType: z.ZodEnum<{
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
        "menu-item-display": "menu-item-display";
        "menu-item-action": "menu-item-action";
        "menu-item-output": "menu-item-output";
        map: "map";
        menu: "menu";
        "business-event": "business-event";
        tile: "tile";
        kpi: "kpi";
    }>;
    fieldsHint: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare function prepareCreateTool(request: any, context: XppServerContext): Promise<any>;
//# sourceMappingURL=prepareCreate.d.ts.map