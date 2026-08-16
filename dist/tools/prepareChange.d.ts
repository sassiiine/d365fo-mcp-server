/**
 * prepare_change — single-round context aggregator for D365FO extension work.
 *
 * Gathers in one call everything an AI needs to safely extend an existing
 * D365FO object:
 *   - exact method signature from the symbol index
 *   - existing CoC wrappers (bridge-first via DYNAMICSXREFDB, index fallback)
 *   - CoC/event-handler eligibility
 *   - recommended extension strategy
 *   - object naming validation for the proposed new name
 *   - relevant code patterns
 *
 * Internally runs up to 5 index/bridge queries in parallel. Returns a
 * provenance token (SHA-256, 30-min TTL) that proves the model looked at
 * the real codebase before writing code.
 *
 * Fail-closed enforcement: when GROUNDING_ENFORCE=true, extension patterns
 * in generate_object(mode="pattern") and d365fo_file(action="create") require this token.
 */
import { z } from 'zod';
import type { XppServerContext } from '../types/context.js';
export declare const prepareChangeArgsSchema: z.ZodObject<{
    goal: z.ZodString;
    objectName: z.ZodString;
    methodName: z.ZodOptional<z.ZodString>;
    objectType: z.ZodOptional<z.ZodEnum<{
        view: "view";
        "data-entity": "data-entity";
        class: "class";
        table: "table";
        form: "form";
        query: "query";
        enum: "enum";
        edt: "edt";
        report: "report";
        "security-duty": "security-duty";
        "security-role": "security-role";
        map: "map";
    }>>;
    proposedName: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function prepareChangeTool(request: any, context: XppServerContext): Promise<any>;
//# sourceMappingURL=prepareChange.d.ts.map