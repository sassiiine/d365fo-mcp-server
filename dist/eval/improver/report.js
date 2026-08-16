/**
 * Corpus scoreboard (docs/AGENT_EVAL_LOOP.md §7): aggregate run records into
 * per-tier pass-rates and the headline tool-defect rate, tracked over the catalog.
 * Pure + VM-free.
 */
export function bpState(run) {
    const bp = run.score?.bp_clean;
    if (run.build?.bp_checked === true)
        return bp === 1 ? 'clean' : 'dirty';
    if (bp === 0)
        return 'dirty';
    return 'unverified';
}
/** Classes that count as an actionable server gap for the tool-defect rate. */
const ACTIONABLE = new Set(['TOOL_DEFECT', 'KNOWLEDGE_GAP', 'VALIDATOR_GAP']);
function frac(n, d) {
    return d === 0 ? 0 : n / d;
}
function passRates(runs) {
    const n = runs.length;
    // BP is averaged over VERIFIED runs only — a run with no BP evidence is not
    // comparable with one that was actually checked, so it is counted, not blended.
    const states = runs.map(bpState);
    const verified = states.filter(s => s !== 'unverified').length;
    return {
        pass_at_build: frac(runs.filter(r => r.score?.build === 1).length, n),
        pass_at_bp_clean: verified === 0 ? null : frac(states.filter(s => s === 'clean').length, verified),
        bp_verified: verified,
        bp_unverified: states.length - verified,
        pass_at_golden: frac(runs.filter(r => r.score?.golden_match === 1).length, n),
    };
}
export function buildReport(runs) {
    const tiers = [...new Set(runs.map(r => r.tier))].sort((a, b) => a - b);
    const byTier = tiers.map(tier => {
        const subset = runs.filter(r => r.tier === tier);
        return { tier, count: subset.length, ...passRates(subset) };
    });
    const classificationCounts = {};
    for (const r of runs) {
        classificationCounts[r.classification] = (classificationCounts[r.classification] ?? 0) + 1;
    }
    const actionable = runs.filter(r => ACTIONABLE.has(r.classification)).length;
    return {
        total: runs.length,
        byTier,
        toolDefectRate: frac(actionable, runs.length),
        ...passRates(runs),
        classificationCounts,
    };
}
function pct(f) {
    return `${Math.round(f * 100)}%`;
}
/** Render the BP dimension, never hiding how much of the bucket was unmeasured. */
function bp(stats) {
    const value = stats.pass_at_bp_clean === null ? 'n/a' : pct(stats.pass_at_bp_clean);
    const suffix = stats.bp_unverified > 0
        ? ` [${stats.bp_verified} checked, ${stats.bp_unverified} unverified]`
        : '';
    return `bp=${value}${suffix}`;
}
export function renderReport(r) {
    if (r.total === 0)
        return 'No corpus runs to report.';
    const lines = [
        `# Corpus scoreboard — ${r.total} run(s)`,
        '',
        `overall   build=${pct(r.pass_at_build)}  ${bp(r)}  golden=${pct(r.pass_at_golden)}`,
        `tool-defect rate: ${pct(r.toolDefectRate)} (TOOL_DEFECT/KNOWLEDGE_GAP/VALIDATOR_GAP)`,
        '',
        '## By tier',
    ];
    for (const t of r.byTier) {
        lines.push(`  L${t.tier}  n=${t.count}  build=${pct(t.pass_at_build)}  ${bp(t)}  golden=${pct(t.pass_at_golden)}`);
    }
    if (r.bp_unverified > 0) {
        lines.push('', `note: ${r.bp_unverified} run(s) carry no BP evidence (captured before \`build.bp_checked\` existed,`, '      or scored with bp_clean: null). They are excluded from the BP pass-rate rather than', '      averaged in — "BP-clean" and "BP never checked" are not the same measurement.');
    }
    lines.push('', '## Classifications');
    for (const [cls, n] of Object.entries(r.classificationCounts).sort((a, b) => b[1] - a[1])) {
        lines.push(`  ${cls.padEnd(14)} ${n}`);
    }
    return lines.join('\n');
}
//# sourceMappingURL=report.js.map