/**
 * Structural diff for the eval golden oracle. Compares two normalized
 * `path → value` maps (see normalize.ts) and classifies each delta as
 * missing / extra / changed, mirroring eval/corpus/schema.json `golden_diff`.
 */
export interface GoldenDiff {
    matched: boolean;
    /** Paths present in the golden but absent from the actual. */
    missing: string[];
    /** Paths present in the actual but absent from the golden. */
    extra: string[];
    /** Paths present in both with differing values. */
    changed: Array<{
        path: string;
        expected: string;
        actual: string;
    }>;
}
/**
 * Diff a normalized actual against a normalized golden (expected).
 * `expected` = the golden; `actual` = what the run produced.
 */
export declare function diffNormalized(expected: Map<string, string>, actual: Map<string, string>): GoldenDiff;
/** Render a GoldenDiff as a short human-readable report. */
export declare function renderDiff(d: GoldenDiff): string;
//# sourceMappingURL=diff.d.ts.map