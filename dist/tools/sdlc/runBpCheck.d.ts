import { type DbLike } from '../../utils/symbolLookup.js';
/**
 * Translate a caller-supplied objectType into the token xppbp accepts.
 *
 * The map above existed but was only consulted when the caller OMITTED the
 * type; a supplied one was passed through `.toLowerCase()`. So the kebab-case
 * spelling every other tool in this server takes — `objectType:
 * "table-extension"`, exactly as verify_d365fo_project documents it — reached
 * xppbp verbatim and was rejected with "The element type 'table-extension' is
 * invalid". Same vocabulary, two tools, one of them wrong.
 *
 * Anything already in xppbp's own spelling ("TableExtension") still works: it
 * squashes to the same token.
 */
export declare function normalizeElementType(raw: string): string;
/**
 * xppbp's "I did not run" responses, as a sentence — or '' when it ran.
 *
 * A rejected element type makes xppbp print a complaint and no findings, and
 * "no findings" is indistinguishable from a clean object unless something looks
 * for the complaint. It did not, so a check that never executed was reported as
 * `✅ clean`, which is the one BP outcome worse than a failure: it is a pass the
 * caller will act on.
 */
export declare function describeNonRun(output: string): string;
/**
 * Element names xppbp mentions in its output. Recognises the two shapes it
 * emits: an AOT file path (`…\AxTable\ConDemoTicket.xml`) and a quoted element
 * reference (`element 'ConDemoTicket'` / `Table 'ConDemoTicket'`).
 */
export declare function extractReportedElements(output: string): string[];
export interface ParsedBpFinding {
    /**
     * The rule name, or null when the line only carried a severity prefix
     * ('BPError: …') and never named the rule — see BARE_PREFIXES below.
     */
    moniker: string | null;
    /** Whatever xppbp printed after the moniker — usually a file path, sometimes free text. */
    target: string;
    /** From the extracted catalog (src/knowledge/bpMonikers/), when the moniker is known there. */
    description: string | null;
    /** False for a moniker xppbp printed that the catalog does not recognise at all — worth a second look, not necessarily wrong. */
    knownMoniker: boolean;
}
/**
 * Pull `{moniker, target}` out of every plain-text finding line in a BP check's
 * raw output, and cross-reference each moniker against the extracted catalog
 * (src/knowledge/bpMonikers/) so its real description travels with the finding
 * instead of being left as a name to look up by hand — the direct fix for a
 * moniker only ever being identifiable by eye from the raw log.
 *
 * Pure and independent of any live BP-check run — takes the same `output` text
 * this tool already produces, so it is unit-testable with no xppbp.exe needed.
 */
export declare function parseBpFindings(output: string): ParsedBpFinding[];
/**
 * Findings section appended to a BP check's text output — the moniker and its
 * real description (when the catalog has one) laid out so the model never has
 * to re-derive the moniker by eyeballing the raw log below it.
 */
export declare function renderFindingsSection(output: string): string;
/**
 * Scope-verification note for a filtered run (#25). xppbp silently ignores an
 * unknown filter flag, so a scoped call can quietly return whole-model results;
 * saying so is better than leaving the agent to attribute findings by hand.
 */
export declare function describeScope(targetFilter: string, output: string): string;
/** One object as the caller asked for it — the type may still be missing. */
export interface RequestedTarget {
    name: string;
    /** Explicit element type, when the caller supplied one. */
    type?: string;
}
/**
 * Normalize the two accepted call shapes into one list: the batch form
 * `objects: [{objectType, objectName}]` (mirrors verify_d365fo_project) and the
 * original single-target `targetElementType` + `targetFilter`. A bare string is
 * accepted wherever an object entry is — `objects: "MyClass"` and
 * `objects: ["MyClass"]` both mean a one-element list.
 */
export declare function normalizeTargets(params: any): RequestedTarget[];
/**
 * Element type for a name the caller did not type, looked up in the symbol
 * index. `run_bp_check` used to fall back to `class`, which silently checked
 * the wrong element kind and cost a round trip (#828) — an ambiguous or
 * unknown name now errors instead.
 */
export declare function resolveElementType(name: string, db: DbLike | undefined): {
    elementType?: string;
    error?: string;
};
/**
 * Split the preamble xppbp repeats on every invocation (banner, memory counter,
 * enabled-rules list) off the front of a batch's outputs, so it can be printed
 * once instead of once per object (#828). Lines are compared with digits
 * masked, because the memory counter differs by a megabyte between runs.
 * A single output has nothing to share and is returned untouched.
 */
export declare function splitSharedPreamble(outputs: string[]): {
    preamble: string[];
    bodies: string[][];
};
export declare const runBpCheckTool: (params: any, context: any) => Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: boolean | undefined;
}>;
//# sourceMappingURL=runBpCheck.d.ts.map