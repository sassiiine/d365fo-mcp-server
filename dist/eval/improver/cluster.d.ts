/**
 * Corpus clustering for the improver (docs/AGENT_EVAL_LOOP.md §10.1–10.2).
 *
 * Groups non-PASS corpus runs by (classification, symptom) and ranks the clusters
 * by `frequency × tier_weight` so the highest-leverage tool/knowledge/validator
 * gap is picked first. Pure + VM-free: the CLI feeds it records read from disk.
 */
export interface CorpusRun {
    run_id: string;
    case_id: string;
    tier: number;
    classification: string;
    root_cause_hypothesis?: string;
    suggested_fix_area?: string;
    score?: {
        tier_weight?: number;
        build?: number;
        bp_clean?: number;
        golden_match?: number;
    };
}
export interface Cluster {
    classification: string;
    symptom: string;
    /** Number of runs in the cluster. */
    frequency: number;
    /** Sum of tier weights (severity proxy). */
    tierWeightSum: number;
    /** Ranking score = frequency × max tier weight in the cluster. */
    priority: number;
    caseIds: string[];
    runIds: string[];
}
/**
 * Derive a short, stable symptom key for a run. Clusters group FAILURES, so the
 * root-cause description (what went wrong) is a more stable key than the fix area
 * (which may read "FIXED: …"). Fall back to fix area, then the classification.
 */
export declare function symptomOf(run: CorpusRun): string;
/**
 * Cluster the actionable (non-PASS) runs. `includeAll=true` keeps every class
 * (incl. PASS / MODEL_ERROR / ENV_FLAKE) — useful for reporting, not prioritising.
 */
export declare function clusterRuns(runs: CorpusRun[], includeAll?: boolean): Cluster[];
/** Render ranked clusters as a short report. */
export declare function renderClusters(clusters: Cluster[]): string;
//# sourceMappingURL=cluster.d.ts.map