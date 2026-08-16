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
declare const SCORE_FIELDS: readonly ['build', 'bp_clean', 'golden_match', 'systest'];
type ScoreField = (typeof SCORE_FIELDS)[number];
/**
 * Minimal shape this module needs from a corpus record. Deliberately not
 * `cluster.ts`'s `CorpusRun` — that type's `score` lacks `systest` and has no
 * `server_git_sha`, neither of which fit a structural extension cleanly.
 */
export interface FlakeCorpusRun {
    run_id: string;
    case_id: string;
    server_git_sha?: string;
    score?: Partial<Record<ScoreField, number | null>>;
}
export interface ScoreDisagreement {
    field: ScoreField;
    /** run_id -> value, only for runs where the value differs from the group's first value. */
    values: Record<string, number | null | undefined>;
}
export interface FlakeCandidate {
    case_id: string;
    server_git_sha: string;
    runIds: string[];
    disagreements: ScoreDisagreement[];
}
/**
 * Group runs by (case_id, server_git_sha) and flag any group where the same
 * case scored differently against the exact same code under test.
 */
export declare function detectFlakeCandidates(runs: FlakeCorpusRun[]): FlakeCandidate[];
/** Render flake candidates as a short human-readable report. */
export declare function renderFlakeCandidates(candidates: FlakeCandidate[]): string;
export {};
//# sourceMappingURL=flakeDetection.d.ts.map