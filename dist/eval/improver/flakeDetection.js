/**
 * Flake detection (docs/AGENT_EVAL_LOOP.md §9, "Self-improving upgrades"). VM-free.
 *
 * A failure is only worth turning into a fix if it's REPRODUCIBLE (§9 rubric:
 * "TOOL_DEFECT/VALIDATOR_GAP must be reproducible deterministically"). If two
 * runs of the SAME case against the SAME server_git_sha (so no code changed
 * between them — any difference can't be a real fix or regression) score
 * differently, that disagreement is non-determinism: infra flake (build
 * server hiccup, locking, timeout), not a real defect.
 *
 * This module only DETECTS and REPORTS candidates — it never rewrites a
 * corpus record's classification. Corpus runs are immutable evidence keyed to
 * server_git_sha (see eval/ROADMAP.md); a human/improver-agent reviews a flake
 * candidate and, if confirmed, the NEXT run for that case gets classified
 * ENV_FLAKE explicitly via the oracle CLI's --classification flag.
 */
/** Score fields compared for disagreement between same-sha runs. */
const SCORE_FIELDS = ['build', 'bp_clean', 'golden_match', 'systest'];
/**
 * Group runs by (case_id, server_git_sha) and flag any group where the same
 * case scored differently against the exact same code under test.
 */
export function detectFlakeCandidates(runs) {
    const groups = new Map();
    for (const run of runs) {
        if (!run.server_git_sha)
            continue;
        const key = `${run.case_id}\0${run.server_git_sha}`;
        const arr = groups.get(key);
        if (arr)
            arr.push(run);
        else
            groups.set(key, [run]);
    }
    const candidates = [];
    for (const [key, groupRuns] of groups) {
        if (groupRuns.length < 2)
            continue;
        const [case_id, server_git_sha] = key.split('\0');
        const disagreements = [];
        for (const field of SCORE_FIELDS) {
            const distinct = new Set(groupRuns.map(r => r.score?.[field] ?? null));
            if (distinct.size > 1) {
                const values = {};
                for (const r of groupRuns)
                    values[r.run_id] = r.score?.[field] ?? null;
                disagreements.push({ field, values });
            }
        }
        if (disagreements.length > 0) {
            candidates.push({ case_id, server_git_sha, runIds: groupRuns.map(r => r.run_id), disagreements });
        }
    }
    // Most-disagreeing cases first, then by case_id for stable output.
    candidates.sort((a, b) => b.disagreements.length - a.disagreements.length || a.case_id.localeCompare(b.case_id));
    return candidates;
}
/** Render flake candidates as a short human-readable report. */
export function renderFlakeCandidates(candidates) {
    if (candidates.length === 0)
        return 'No flake candidates — every repeated (case, server_git_sha) pair scored consistently. 🎉';
    const lines = [`# Flake candidates (${candidates.length})\n`];
    candidates.forEach((c, i) => {
        lines.push(`${i + 1}. ${c.case_id} @ ${c.server_git_sha}  (${c.runIds.length} runs: ${c.runIds.join(', ')})`);
        for (const d of c.disagreements) {
            const pairs = Object.entries(d.values).map(([runId, v]) => `${runId}=${v}`).join(', ');
            lines.push(`   ~ ${d.field} disagrees: ${pairs}`);
        }
    });
    return lines.join('\n');
}
//# sourceMappingURL=flakeDetection.js.map