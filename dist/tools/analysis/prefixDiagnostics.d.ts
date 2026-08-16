/**
 * The "Prefix Configuration" section of `get_workspace_info`.
 *
 * Two rules decide everything here:
 *
 * 1. The prefix is reported for the model that WRITES land in — the write anchor
 *    (see ConfigManager.getWriteAnchorModel). A tool-initiated project switch
 *    moves the active project without moving that anchor, so after one the two
 *    are different models with different prefixes; reporting the active model's
 *    prefix would state a token no write would ever apply.
 * 2. The reported value always carries its origin. The prefix can come from the
 *    model's own objects, from EXTENSION_PREFIX, or from the model name, and a
 *    bare "Effective prefix: ConFin" under "EXTENSION_PREFIX: Con" reads as
 *    approved rather than as the disagreement it is.
 *
 * The resolution itself lives in utils/effectivePrefix.ts, which
 * validate_object_naming reads too — the two used to resolve it separately and
 * contradict each other (#833).
 */
export { modelWritesLandIn } from '../../utils/effectivePrefix.js';
export interface PrefixDiagnostics {
    /**
     * Compact default: one `Prefix : …` line, plus a note only when something is
     * actually off (a switch is in effect, or the resolved prefix contradicts the
     * configuration). Every call of get_workspace_info pays for these tokens, so
     * the confirmations that only restate the value stay in `verboseLines`.
     */
    lines: string[];
    /** Full "## Prefix Configuration" section — diagnostics=true only. */
    verboseLines: string[];
    /** The prefix a write would apply — for the Extension Naming samples. */
    effectivePrefix: string;
}
/**
 * @param writeModel model writes are anchored to; the prefix is resolved for it
 * @param readModel  model reads currently come from — differs from `writeModel`
 *                   only while a tool project switch is in effect
 */
export declare function buildPrefixDiagnostics(writeModel: string | null, readModel: string | null): PrefixDiagnostics;
//# sourceMappingURL=prefixDiagnostics.d.ts.map