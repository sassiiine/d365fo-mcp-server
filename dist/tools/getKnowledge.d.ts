/**
 * get_knowledge Tool — unified knowledge-lookup entry point.
 *
 * Replaces two knowledge tools with one discriminated by `kind`:
 *   • knowledge → queryable X++ rulebook (patterns, BP rules, migration)
 *   • error     → diagnose a D365FO/X++ compiler or runtime error
 *
 * Both underlying handlers take the request only (no context). Handler files
 * stay where they are — only the MCP surface is consolidated.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
export declare const KNOWLEDGE_KINDS: readonly ["knowledge", "error"];
export type KnowledgeKind = (typeof KNOWLEDGE_KINDS)[number];
export declare function getKnowledgeTool(request: CallToolRequest): Promise<{
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
//# sourceMappingURL=getKnowledge.d.ts.map