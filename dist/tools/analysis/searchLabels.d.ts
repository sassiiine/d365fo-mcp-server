/**
 * Search Labels Tool
 * Full-text search across indexed AxLabelFile entries.
 * Returns matching labels with their ID, text, comment and model/language info.
 *
 * Typical use-cases:
 *  - Find existing labels before creating new ones
 *  - Discover the @ABC:MyLabel reference syntax to use in code or metadata
 *  - List all labels for a specific label file / model
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
/**
 * Emitted only when a label the current model can actually resolve was found.
 * `labels` reads it back to decide whether a batch of queries found anything
 * reusable, so keep the two in step.
 */
export declare const REUSABLE_MARKER = "\uD83D\uDCA1 Use the label reference syntax in X++:";
/**
 * Opens the answer for a query that matched nothing. `labels` reads it back to
 * collapse those sections in a batch — a paragraph of identical advice repeated
 * once per phrasing was most of a 5 KB result — so keep the two in step.
 */
export declare const NO_HITS_MARKER = "No labels found matching";
export declare const NO_REUSE_ADVICE: string;
/**
 * Same call, for the branch where hits DID come back.
 *
 * NO_REUSE_ADVICE opens with "Nothing reusable here", which contradicts a verdict
 * that just reported a resolvable label. Callers resolve the contradiction by
 * searching again — the loop the verdict exists to end.
 */
export declare const SOME_REUSE_ADVICE: string;
export declare function searchLabelsTool(request: CallToolRequest, context: XppServerContext): Promise<{
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
//# sourceMappingURL=searchLabels.d.ts.map