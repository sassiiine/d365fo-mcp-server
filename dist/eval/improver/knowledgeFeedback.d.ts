/**
 * Knowledge-base feedback channel (docs/AGENT_EVAL_LOOP.md §9, "Self-improving
 * upgrades"). VM-free.
 *
 * MODEL_ERROR clusters are NOT tool defects — `clusterRuns()` deliberately
 * excludes them from the actionable (code-fix) set. But a recurring
 * MODEL_ERROR is still signal: if the same mistake shows up across multiple
 * runs, the agent is plausibly missing (or being misled by) a rule that
 * belongs in the X++ knowledge base (`src/tools/xppKnowledge.ts`), not a tool
 * bug. This module clusters MODEL_ERROR runs the same way the code-fix path
 * clusters TOOL_DEFECT/KNOWLEDGE_GAP/VALIDATOR_GAP runs, then proposes which
 * existing knowledge topic (by keyword overlap) is the best edit target — or
 * flags that no existing topic matches, meaning a new one is needed.
 *
 * This module only PROPOSES; it never edits xppKnowledge.ts itself — unlike a
 * code fix (which is mechanically verifiable via a regression test), an
 * instruction/knowledge edit changes agent *behaviour* and needs a human (or
 * the improver agent, with explicit review) to judge whether the proposed
 * rule is actually correct before it lands.
 */
import { type CorpusRun, type Cluster } from './cluster.js';
export interface KnowledgeEntryLike {
    id: string;
    title: string;
    keywords: string[];
}
export interface KnowledgeProposal {
    cluster: Cluster;
    /** Best-matching existing topic, or null if nothing scored above zero. */
    suggestedTopicId: string | null;
    suggestedTopicTitle: string | null;
    matchScore: number;
    /** True when no existing topic matched — this cluster likely needs a new entry. */
    isNewTopic: boolean;
}
/** MODEL_ERROR clusters, ranked the same way as the code-fix clusters (frequency × tier_weight). */
export declare function modelErrorClusters(runs: CorpusRun[]): Cluster[];
/**
 * Score a symptom string against one knowledge entry's keyword list: each
 * keyword that appears as a substring of a symptom token (or vice versa)
 * scores 1. Mirrors the simple substring-overlap approach xppKnowledge.ts's
 * own searchKnowledge() uses, so proposals are consistent with what a live
 * get_knowledge(topic=...) call would actually surface.
 */
export declare function scoreTopicMatch(symptom: string, entry: KnowledgeEntryLike): number;
/** Best-matching knowledge entry for a symptom, or null if no entry scores above zero. */
export declare function suggestKnowledgeTopic(symptom: string, knowledgeBase: KnowledgeEntryLike[]): {
    id: string;
    title: string;
    score: number;
} | null;
/** Build one proposal per MODEL_ERROR cluster, ranked by cluster priority. */
export declare function buildKnowledgeProposals(runs: CorpusRun[], knowledgeBase: KnowledgeEntryLike[]): KnowledgeProposal[];
/** Render proposals as a short, human-readable report. */
export declare function renderKnowledgeProposals(proposals: KnowledgeProposal[]): string;
//# sourceMappingURL=knowledgeFeedback.d.ts.map