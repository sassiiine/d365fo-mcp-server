/**
 * Context Ranker — Phase 2 of the context pipeline.
 *
 * Given a free-text intent (e.g. a prepare `goal`) and an optional active
 * object, rank the most relevant symbols from the codebase and return a
 * token-budgeted neighborhood that grounds the next generation step.
 *
 * Index-only and deterministic: candidates come from the FTS5 index, scoring
 * uses precomputed xref/usage signals (no bridge call needed), and each item
 * carries explainable `reasons`. Every index access is guarded so a
 * missing/empty index yields an empty ranking rather than an error.
 */
import type { XppServerContext } from '../types/context.js';
export interface RankContextInput {
    /** Free-text description of the goal/intent. */
    intent: string;
    /** Object currently in focus, used as a relationship anchor. */
    activeObject?: {
        name: string;
        type?: string;
    };
    /** Max items to return after budgeting (default 12). */
    limit?: number;
    /** Approximate token budget for the rendered neighborhood (default 700). */
    tokenBudget?: number;
    /** Restrict candidate symbol types (e.g. ['class','table']). */
    types?: string[];
}
export interface RankedItem {
    name: string;
    type: string;
    model: string;
    parentName?: string;
    signature?: string;
    score: number;
    reasons: string[];
}
export interface RankedContext {
    intent: string;
    activeObject?: {
        name: string;
        type?: string;
    };
    items: RankedItem[];
    /** True when candidates were dropped to fit the budget/limit. */
    truncated: boolean;
    approxTokens: number;
}
/** Split free text into meaningful lowercase tokens (≥3 chars, no stopwords). */
export declare function tokenizeIntent(intent: string): string[];
/**
 * Rank relevant symbols for an intent + optional active object.
 * Returns a token-budgeted, explainable neighborhood. Never throws.
 */
export declare function rankContext(context: XppServerContext, input: RankContextInput): Promise<RankedContext>;
/** Render a ranked neighborhood as markdown lines for tool output. */
export declare function renderRankedContext(ranked: RankedContext): string[];
//# sourceMappingURL=contextRanker.d.ts.map