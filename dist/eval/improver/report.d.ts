/**
 * Corpus scoreboard (docs/AGENT_EVAL_LOOP.md §7): aggregate run records into
 * per-tier pass-rates and the headline tool-defect rate, tracked over the catalog.
 * Pure + VM-free.
 */
export interface RunForReport {
    case_id: string;
    tier: number;
    classification: string;
    score?: {
        build?: number;
        bp_clean?: number | null;
        golden_match?: number | null;
        tier_weight?: number;
    };
    /** `bp_checked` is the BP-provenance flag written by the oracle CLI (see `bpState`). */
    build?: {
        bp_checked?: boolean;
    };
}
/**
 * Which of the three BP states a run is in.
 *
 * `bp_clean` used to have two values where it needed three: a run whose capture
 * never ran xppbp scored 1, indistinguishable from a run that ran it and found
 * nothing. Averaging the two together is meaningless — the number mixes
 * "BP-clean" with "BP never checked" (docs/eval-sweep-findings-2026-07-21.md #3).
 *
 * Going forward the oracle CLI records `build.bp_checked` and `bp_clean: null`,
 * so the state is explicit. For the ~70 records written BEFORE that flag existed
 * there is exactly one thing we can honestly infer: `bp_clean: 0` was only ever
 * reachable from OBSERVED warnings, so a 0 proves the check ran. A legacy 1
 * proves nothing either way — it is marked `unverified` and kept OUT of the
 * pass-rate rather than retro-edited into a value nobody measured.
 */
export type BpState = 'clean' | 'dirty' | 'unverified';
export declare function bpState(run: RunForReport): BpState;
export interface TierStats {
    tier: number;
    count: number;
    pass_at_build: number;
    /** Over BP-VERIFIED runs only; `null` when none of them is verified. */
    pass_at_bp_clean: number | null;
    /** How many runs in this bucket carry usable BP evidence, and how many do not. */
    bp_verified: number;
    bp_unverified: number;
    pass_at_golden: number;
}
export interface Report {
    total: number;
    byTier: TierStats[];
    /** Fraction of runs whose class is an actionable server gap (the headline metric). */
    toolDefectRate: number;
    pass_at_build: number;
    /** Over BP-VERIFIED runs only; `null` when no run carries BP evidence (see `bpState`). */
    pass_at_bp_clean: number | null;
    bp_verified: number;
    bp_unverified: number;
    pass_at_golden: number;
    classificationCounts: Record<string, number>;
}
export declare function buildReport(runs: RunForReport[]): Report;
export declare function renderReport(r: Report): string;
//# sourceMappingURL=report.d.ts.map