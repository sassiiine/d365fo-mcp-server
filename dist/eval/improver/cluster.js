/**
 * Corpus clustering for the improver (docs/AGENT_EVAL_LOOP.md §10.1–10.2).
 *
 * Groups non-PASS corpus runs by (classification, symptom) and ranks the clusters
 * by `frequency × tier_weight` so the highest-leverage tool/knowledge/validator
 * gap is picked first. Pure + VM-free: the CLI feeds it records read from disk.
 */
/** Rubric classes that represent an actionable server gap (become fix PRs). */
const ACTIONABLE = new Set(['TOOL_DEFECT', 'KNOWLEDGE_GAP', 'VALIDATOR_GAP']);
/** Strip a leading status marker ("FIXED:", "FIX —", "(1)") and clip to a key. */
function firstClause(text) {
    const cleaned = text
        .replace(/^\s*(FIXED|FIX|DONE|WONTFIX|TODO)\b[:.\-—\s]*/i, '')
        .replace(/^\s*\(?\d+\)?[).:\-\s]*/, '')
        .trim();
    return cleaned.split(/[:.]/)[0].trim().slice(0, 80);
}
/**
 * Derive a short, stable symptom key for a run. Clusters group FAILURES, so the
 * root-cause description (what went wrong) is a more stable key than the fix area
 * (which may read "FIXED: …"). Fall back to fix area, then the classification.
 */
export function symptomOf(run) {
    for (const field of [run.root_cause_hypothesis, run.suggested_fix_area]) {
        if (field && field.trim() !== '') {
            const clause = firstClause(field);
            if (clause.length >= 3)
                return clause;
        }
    }
    return run.classification;
}
/**
 * Cluster the actionable (non-PASS) runs. `includeAll=true` keeps every class
 * (incl. PASS / MODEL_ERROR / ENV_FLAKE) — useful for reporting, not prioritising.
 */
export function clusterRuns(runs, includeAll = false) {
    const buckets = new Map();
    for (const run of runs) {
        if (!includeAll && !ACTIONABLE.has(run.classification))
            continue;
        const symptom = symptomOf(run);
        const key = `${run.classification}\0${symptom}`;
        const tw = run.score?.tier_weight ?? run.tier ?? 0;
        let c = buckets.get(key);
        if (!c) {
            c = {
                classification: run.classification,
                symptom,
                frequency: 0,
                tierWeightSum: 0,
                priority: 0,
                caseIds: [],
                runIds: [],
                tierWeights: [],
            };
            buckets.set(key, c);
        }
        c.frequency += 1;
        c.tierWeightSum += tw;
        c.tierWeights.push(tw);
        if (!c.caseIds.includes(run.case_id))
            c.caseIds.push(run.case_id);
        c.runIds.push(run.run_id);
    }
    const clusters = [...buckets.values()].map(c => {
        const maxTw = Math.max(1, ...c.tierWeights);
        const { tierWeights, ...rest } = c;
        return { ...rest, priority: c.frequency * maxTw };
    });
    // Highest priority first; ties broken by frequency then classification.
    clusters.sort((a, b) => b.priority - a.priority ||
        b.frequency - a.frequency ||
        a.classification.localeCompare(b.classification));
    return clusters;
}
/** Render ranked clusters as a short report. */
export function renderClusters(clusters) {
    if (clusters.length === 0)
        return 'No actionable failure clusters — corpus is clean. 🎉';
    const lines = [`# Corpus failure clusters (${clusters.length}), ranked by priority\n`];
    clusters.forEach((c, i) => {
        lines.push(`${i + 1}. [${c.classification}] ${c.symptom}`);
        lines.push(`   priority=${c.priority}  freq=${c.frequency}  tierΣ=${c.tierWeightSum}  cases=${c.caseIds.join(', ')}`);
        lines.push(`   runs: ${c.runIds.join(', ')}`);
    });
    return lines.join('\n');
}
//# sourceMappingURL=cluster.js.map