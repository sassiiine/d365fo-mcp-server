/**
 * BP Moniker Tool — validate, search, and generate suppressions for
 * Best-Practice-check diagnostic monikers.
 *
 * Backed by the extracted catalog (src/knowledge/bpMonikers/), not memory —
 * see that module's docblock for why. Three actions:
 *   • validate → is this exact moniker real? (case-insensitive exact match)
 *   • search   → free-text query against real rule message/description text,
 *                for when you have a scenario but no moniker yet ("pull one
 *                out of a hat" case — e.g. mid-development, before a BP check
 *                has actually been run)
 *   • suppress → render one <Diagnostic> block for {Model}_BPSuppressions.xml
 *
 * This handler has no schema of its own — it is reached through the unified
 * get_knowledge tool. Tool registration (name/description/inputSchema) lives
 * in src/server/toolSchemas/getKnowledge.ts.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
export declare function bpMonikerHelpTool(request: CallToolRequest): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    isError?: undefined;
    content: {
        type: string;
        text: string;
    }[];
}>;
//# sourceMappingURL=bpMonikerHelp.d.ts.map