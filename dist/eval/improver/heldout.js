/**
 * Train/holdout split + anti-overfitting regression gate (docs/AGENT_EVAL_LOOP.md §10).
 *
 * A fix is accepted only if **holdout** scores do not regress — improvements
 * tuned to the cases they were derived from (train) don't count. New cases enter
 * the holdout set first, so a fix cannot be overfit to them.
 *
 * Pure + VM-free: callers supply already-scored cases (from the oracle / corpus).
 */
/** 'clean' | 'dirty' | 'unverified' — see `bpState` in report.ts. */
function bpVerified(c) {
    return c.bpChecked === true || c.score.bp_clean === 0;
}
function frac(n, d) {
    return d === 0 ? 0 : n / d;
}
export function aggregate(cases) {
    const count = cases.length;
    return {
        count,
        pass_at_build: frac(cases.filter(c => c.score.build === 1).length, count),
        pass_at_bp_clean: (() => {
            const verified = cases.filter(bpVerified);
            return verified.length === 0
                ? null
                : frac(verified.filter(c => c.score.bp_clean === 1).length, verified.length);
        })(),
        pass_at_golden: frac(cases.filter(c => c.score.golden_match === 1).length, count),
    };
}
export function aggregateBySplit(cases) {
    return {
        train: aggregate(cases.filter(c => c.split === 'train')),
        holdout: aggregate(cases.filter(c => c.split === 'holdout')),
    };
}
const METRICS = [
    'pass_at_build', 'pass_at_bp_clean', 'pass_at_golden',
];
/**
 * Compare a candidate holdout aggregate against a baseline. Fails if any metric
 * drops by more than `epsilon` (default 0 — no regression tolerated). A candidate
 * that improves or ties on every metric passes.
 */
export function holdoutRegressed(baseline, candidate, epsilon = 0) {
    const regressions = [];
    for (const m of METRICS) {
        const b = baseline[m];
        const c = candidate[m];
        // A `null` side means the metric was not measured on that run — there is no
        // regression to assert, and fabricating a 0 would invent a failure.
        if (b === null || c === null)
            continue;
        if (c < b - epsilon) {
            regressions.push({ metric: m, baseline: b, candidate: c });
        }
    }
    return { ok: regressions.length === 0, regressions };
}
export function renderSplitReport(agg) {
    const row = (name, a) => `  ${name.padEnd(8)} n=${a.count}  build=${pct(a.pass_at_build)}  bp=${a.pass_at_bp_clean === null ? 'n/a' : pct(a.pass_at_bp_clean)}  golden=${pct(a.pass_at_golden)}`;
    return ['# Scores by split', row('train', agg.train), row('holdout', agg.holdout)].join('\n');
}
function pct(f) {
    return `${Math.round(f * 100)}%`;
}
//# sourceMappingURL=heldout.js.map