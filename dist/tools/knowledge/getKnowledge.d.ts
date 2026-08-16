/**
 * get_knowledge Tool — unified knowledge-lookup entry point.
 *
 * Four kinds behind one tool (KNOWLEDGE_KINDS below is the authority); the
 * first two absorbed the retired standalone knowledge tools:
 *   • knowledge  → queryable X++ rulebook (patterns, BP rules, migration)
 *   • error      → diagnose a D365FO/X++ compiler or runtime error
 *   • op-spec    → parameter contract for one d365fo_file operation/objectType
 *                  or one generate_object mode (issue #825: these no longer ship
 *                  inline in those tools' wire schemas)
 *   • bp-moniker → validate/search a BP-check diagnostic moniker, or render a
 *                  _BPSuppressions.xml block (src/knowledge/bpMonikers/)
 *
 * The knowledge/error handlers take the request only (no context). Handler files
 * stay where they are — only the MCP surface is consolidated.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
export declare const KNOWLEDGE_KINDS: readonly ['knowledge', 'error', 'op-spec', 'bp-moniker'];
export type KnowledgeKind = (typeof KNOWLEDGE_KINDS)[number];
export declare function getKnowledgeTool(request: CallToolRequest): Promise<{
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
//# sourceMappingURL=getKnowledge.d.ts.map