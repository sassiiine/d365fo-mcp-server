/**
 * System Instructions Prompt for X++ Development
 * Optimized for MCP-capable AI clients (GitHub Copilot, Claude Code) in Visual Studio 2022 / 2026
 *
 * NOTE: This file is the MCP prompt source of truth for AI system instructions.
 * The static instruction layers (.github/copilot-instructions.md, CLAUDE.md)
 * mirror these rules. If you update rules here, sync them there too.
 *
 * Kept deliberately under 200 lines: the prompt holds only the tool decision
 * tree and hard prohibitions. Everything that is a rule about CODE lives in
 * the queryable knowledge base — get_knowledge (see the ID table below).
 */
/**
 * Get the system instructions prompt definition
 */
export declare function getSystemInstructionsPromptDefinition(): {
    name: string;
    description: string;
    arguments: never[];
};
/**
 * Handle the system instructions prompt request
 */
export declare function handleSystemInstructionsPrompt(): {
    messages: {
        role: string;
        content: {
            type: string;
            text: string;
        };
    }[];
};
//# sourceMappingURL=systemInstructions.d.ts.map