/**
 * object_patterns(domain="form", action="repair") — auto-fill the missing
 * required top-level controls of an existing form from its declared pattern.
 *
 * The "fill an existing form" counterpart to TRUDUtils' Form Template Control
 * Builder. Loads a form (xml / formName / filePath), reads its <Pattern>,
 * generates the absent required controls from the catalog and splices them in
 * (existing controls preserved verbatim — see formControlRepair). Re-validates
 * and returns the repaired XML; it does NOT write — hand the XML to
 * d365fo_file(action="create", overwrite=true) after reviewing it.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function repairFormControlsTool(request: CallToolRequest, context: XppServerContext): Promise<{
    content: {
        type: 'text';
        text: string;
    }[];
    isError?: boolean | undefined;
}>;
//# sourceMappingURL=repairFormControls.d.ts.map