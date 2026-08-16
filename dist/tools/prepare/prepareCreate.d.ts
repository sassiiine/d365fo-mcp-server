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
import type { XppServerContext } from '../../types/context.js';
export declare const prepareCreateArgsSchema: z.ZodObject<{
    goal: z.ZodString;
    objectName: z.ZodString;
    objectType: z.ZodEnum<{
        "aggregate-measurement": "aggregate-measurement";
        "business-event": "business-event";
        class: "class";
        "configuration-key": "configuration-key";
        "data-entity": "data-entity";
        edt: "edt";
        enum: "enum";
        form: "form";
        kpi: "kpi";
        "license-code": "license-code";
        macro: "macro";
        map: "map";
        menu: "menu";
        "menu-item-action": "menu-item-action";
        "menu-item-display": "menu-item-display";
        "menu-item-output": "menu-item-output";
        query: "query";
        report: "report";
        "security-duty": "security-duty";
        "security-policy": "security-policy";
        "security-privilege": "security-privilege";
        "security-role": "security-role";
        service: "service";
        "service-group": "service-group";
        table: "table";
        tile: "tile";
        view: "view";
    }>;
    fieldsHint: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare function prepareCreateTool(request: any, context: XppServerContext): Promise<any>;
//# sourceMappingURL=prepareCreate.d.ts.map