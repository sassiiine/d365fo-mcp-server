/**
 * Create Label Tool
 * Adds a new label to an existing AxLabelFile in a custom model.
 *
 * For each language that has a .label.txt file in the model, the tool:
 *  1. Checks that the label ID does not already exist
 *  2. Inserts the label in alphabetical order
 *  3. Writes the updated file back to disk
 *  4. Updates the SQLite label index
 *
 * If the AxLabelFile does not exist yet (new label file), the tool also
 * creates the XML descriptor files and directory structure.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
/**
 * Pull a `labels: [...]` array off the raw args, if present and non-empty.
 * Bulk callers pass shared fields (labelFileId, model, paths…) at the top level
 * and one entry per label ({ labelId, translations, … }). Returns null for the
 * ordinary single-label shape so the normal path runs unchanged.
 */
export declare function extractBulkLabels(raw: unknown): Array<Record<string, unknown>> | null;
/** The single-label create signature, injectable so the fan-out is testable. */
export type SingleLabelRunner = (request: CallToolRequest, context: XppServerContext) => Promise<any>;
/**
 * Create many labels in one call. Each entry is merged over the shared top-level
 * fields and routed through the single-label path (which keeps validation, file
 * creation and indexing identical), then results are aggregated into one report.
 * Continues past per-label failures so one bad entry doesn't abort the batch.
 */
export declare function createLabelsBulk(entries: Array<Record<string, unknown>>, raw: Record<string, unknown>, context: XppServerContext, runSingle?: SingleLabelRunner): Promise<{
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError: boolean;
}>;
export declare function createLabelTool(request: CallToolRequest, context: XppServerContext): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
}>;
//# sourceMappingURL=createLabel.d.ts.map