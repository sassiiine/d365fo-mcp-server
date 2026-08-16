/**
 * Coverage computation — derive the K/E/T matrix from reality,
 * not by hand.
 *
 * Inputs are the live sources: KNOWLEDGE_BASE entry ids, the eval case
 * catalog, and the set of object types the tool path can actually create.
 * A taxonomy leaf's flags are therefore only as green as the repo really is —
 * deleting a case or renaming a knowledge entry turns a leaf red instead of
 * quietly leaving a stale table behind.
 *
 * The module is pure so it runs in CI with no VM and no symbol index.
 */
import type { CoverageLeaf, CoverageTier } from './taxonomy.js';
export interface EvalCaseSummary {
    id: string;
    tags: string[];
    /** Cases whose golden has not been captured yet do not prove anything. */
    goldenPending: boolean;
}
export interface CoverageInputs {
    /** Every KNOWLEDGE_BASE entry id present in the shipped build. */
    knowledgeIds: Set<string>;
    /** Every eval case in eval/cases. */
    cases: EvalCaseSummary[];
    /** Object types the tool path can create (d365fo_file / generate_object). */
    toolTypes: Set<string>;
}
export interface LeafCoverage {
    leaf: CoverageLeaf;
    k: boolean;
    e: boolean;
    t: boolean;
    covered: boolean;
    /** Case ids that actually matched (evidence for E). */
    matchedCases: string[];
    /** Knowledge ids declared by the leaf that do not exist (spec rot). */
    danglingKnowledge: string[];
    /** Case ids declared by the leaf that do not exist (spec rot). */
    danglingCases: string[];
}
export interface CoverageOrphans {
    /** Knowledge entries no taxonomy leaf claims — unproven knowledge. */
    knowledge: string[];
    /** Eval cases no taxonomy leaf claims — unmapped proof. */
    cases: string[];
}
export interface TierSummary {
    tier: CoverageTier | 'all';
    total: number;
    covered: number;
    percent: number;
}
export interface CoverageReport {
    leaves: LeafCoverage[];
    orphans: CoverageOrphans;
    core: TierSummary;
    total: TierSummary;
    /** Uncovered leaves ordered by weight — the P7 closure queue. */
    queue: LeafCoverage[];
}
export declare function computeCoverage(taxonomy: CoverageLeaf[], inputs: CoverageInputs): CoverageReport;
export declare function renderMarkdown(report: CoverageReport, generatedAt: string): string;
/** Spec rot: a leaf pointing at a knowledge entry or case that no longer exists. */
export declare function danglingReferences(report: CoverageReport): string[];
//# sourceMappingURL=coverage.d.ts.map