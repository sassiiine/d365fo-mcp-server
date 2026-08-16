/**
 * X++ Knowledge Base Tool
 * Queryable knowledge base of D365FO / X++ patterns, best practices,
 * and AX2012 → D365FO migration guidance.
 *
 * Data is embedded — no DB or disk access needed. Available in all server modes.
 *
 * ADDING OR EDITING A TOPIC: read docs/KNOWLEDGE_AUTHORING.md first. Content
 * here ships straight into the model's context with no runtime gate, so three
 * CI tests stand behind it (tests/knowledge/): entry shape, example validity,
 * and — the one that will block your PR — every named AOT type must be in
 * eval/knowledge-audit.snapshot.json, which is captured on a VM. Hypothetical
 * elements in examples must use the `My…` placeholder convention.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
export interface KnowledgeEntry {
    id: string;
    title: string;
    /** Search keywords (lowercase) for matching */
    keywords: string[];
    /** One-paragraph summary */
    summary: string;
    /** AX2012 anti-pattern → D365FO correct pattern */
    migration?: {
        ax2012: string;
        d365fo: string;
    };
    /** Concise bullet-point rules */
    rules: string[];
    /** Code examples (shown in detailed mode) */
    examples?: {
        label: string;
        code: string;
    }[];
    /** Related entry IDs */
    related?: string[];
}
export declare const KNOWLEDGE_BASE: KnowledgeEntry[];
/** Identifier-shaped words in the query that the base does not document by name. */
export declare function unknownDistinctiveTokens(topic: string): string[];
export declare function xppKnowledgeTool(request: CallToolRequest): Promise<{
    isError?: undefined;
    content: {
        type: string;
        text: string;
    }[];
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=xppKnowledge.d.ts.map