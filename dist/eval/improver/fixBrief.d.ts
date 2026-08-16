/**
 * Fix brief generator (docs/AGENT_EVAL_LOOP.md §10, "Autonomous improver"). VM-free.
 *
 * Turns the TOP-PRIORITY actionable cluster (from cluster.ts) into a
 * self-contained Markdown brief: symptom, root cause, evidence, and a concrete
 * task list. This is the hand-off artifact between the two halves of the
 * autonomous-improver idea:
 *
 *   VM half (this repo, interactive session)      VM-free half (CI runner)
 *   ─────────────────────────────────────────     ──────────────────────────
 *   run cases on the D365FO VM → corpus records    reproduce as a failing repo
 *   → `npm run eval:brief` picks the top   ──brief──▶  test → fix → `npx vitest
 *   cluster and writes this brief                  run` + held-out gate → PR
 *
 * The corpus (`eval/corpus/runs/`) is gitignored — it never reaches a CI
 * runner's checkout. So a brief is the thing that DOES cross that boundary:
 * generate it locally (where the corpus lives), then hand it to
 * `.github/workflows/eval-improver.yml` (workflow_dispatch input) to run the
 * reproduce→fix→test→PR loop, which needs only the repo + toolchain, not the
 * VM. This module only builds the text; it never applies a fix itself.
 */
import { type CorpusRun, type Cluster } from './cluster.js';
/** A corpus record with the evidence fields a brief needs (superset of CorpusRun). */
export interface FixBriefRun extends CorpusRun {
    timestamp?: string;
    evidence_refs?: string[];
}
/** The single highest-priority actionable cluster, or null if the corpus is clean. */
export declare function topPriorityCluster(runs: CorpusRun[]): Cluster | null;
/** Render one cluster + its representative evidence as a self-contained Markdown brief. */
export declare function renderFixBrief(cluster: Cluster, runs: FixBriefRun[]): string;
/** Build the brief for the single top-priority cluster, or null if the corpus has nothing actionable. */
export declare function buildTopFixBrief(runs: FixBriefRun[]): string | null;
//# sourceMappingURL=fixBrief.d.ts.map