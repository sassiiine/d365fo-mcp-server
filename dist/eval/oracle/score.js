/**
 * Scorecard for the eval golden oracle (docs/AGENT_EVAL_LOOP.md §7).
 * Layers cheap→expensive: build (hard gate) → bp_clean → golden_match → systest.
 */
export function scoreRun(input) {
    const { build, goldenDiff, tier, systest } = input;
    return {
        build: build.succeeded ? 1 : 0,
        bp_clean: build.bpWarnings === undefined ? null : (build.bpWarnings.length === 0 ? 1 : 0),
        golden_match: goldenDiff.matched ? 1 : 0,
        systest: systest == null || systest.passed == null ? null : (systest.passed ? 1 : 0),
        tier_weight: tier,
    };
}
//# sourceMappingURL=score.js.map