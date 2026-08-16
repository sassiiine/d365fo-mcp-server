/**
 * Train/holdout split + anti-overfitting regression gate (docs/AGENT_EVAL_LOOP.md §10).
 *
 * A fix is accepted only if **holdout** scores do not regress — improvements
 * tuned to the cases they were derived from (train) don't count. New cases enter
 * the holdout set first, so a fix cannot be overfit to them.
 *
 * Pure + VM-free: callers supply already-scored cases (from the oracle / corpus).
 */
export type Split = 'train' | 'holdout';
export interface ScoredCase {
    caseId: string;
    split: Split;
    score: {
        build: number;
        bp_clean: number | null;
        golden_match: number;
    };
    /**
     * Did the capture actually run xppbp? `undefined` = unknown provenance (every
     * record written before the flag existed). Mirrors `bpState` in report.ts:
     * only `bp_clean === 0` proves the check ran, so an unflagged 1 is NOT
     * comparable with a checked one and is left out of `pass_at_bp_clean`
     * (docs/eval-sweep-findings-2026-07-21.md #3).
     */
    bpChecked?: boolean;
}
export interface SplitAggregate {
    count: number;
    /** Fractions in [0,1]. */
    pass_at_build: number;
    /** Over BP-VERIFIED cases only; `null` when none carries BP evidence. */
    pass_at_bp_clean: number | null;
    pass_at_golden: number;
}
export declare function aggregate(cases: ScoredCase[]): SplitAggregate;
export declare function aggregateBySplit(cases: ScoredCase[]): Record<Split, SplitAggregate>;
export interface RegressionResult {
    ok: boolean;
    regressions: Array<{
        metric: keyof Omit<SplitAggregate, 'count'>;
        baseline: number;
        candidate: number;
    }>;
}
/**
 * Compare a candidate holdout aggregate against a baseline. Fails if any metric
 * drops by more than `epsilon` (default 0 — no regression tolerated). A candidate
 * that improves or ties on every metric passes.
 */
export declare function holdoutRegressed(baseline: SplitAggregate, candidate: SplitAggregate, epsilon?: number): RegressionResult;
export declare function renderSplitReport(agg: Record<Split, SplitAggregate>): string;
//# sourceMappingURL=heldout.d.ts.map