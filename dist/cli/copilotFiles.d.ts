/**
 * Offer to place copilot-instructions.md, falling back to a staging folder.
 *
 * `solutionsPath` is what the user gave for workspace.solutionsPath; when it
 * is empty there is nowhere to copy to, so the file is staged instead and the
 * README says where it has to end up.
 */
export declare function maybePrepareCopilotInstructions(solutionsPath: string): Promise<void>;
//# sourceMappingURL=copilotFiles.d.ts.map