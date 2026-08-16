/**
 * X++ Knowledge Base Tool
 * Queryable knowledge base of D365FO / X++ patterns, best practices,
 * and AX2012 → D365FO migration guidance.
 *
 * Data is embedded — no DB or disk access needed. Available in all server modes.
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
export declare function xppKnowledgeTool(request: CallToolRequest): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=xppKnowledge.d.ts.map