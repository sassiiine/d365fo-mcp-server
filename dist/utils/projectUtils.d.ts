/**
 * Shared D365FO project utilities used by generateSmartTable.ts and generateSmartForm.ts.
 */
/**
 * Extract model name from .rnrproj file.
 * Returns null if the file cannot be read (e.g. Windows path on Linux) or
 * if <ModelName> is not found — callers must handle null gracefully.
 */
export declare function extractModelFromProject(projectPath: string): string | null;
/**
 * Find .rnrproj file in solution directory.
 */
export declare function findProjectInSolution(solutionPath: string): string | null;
//# sourceMappingURL=projectUtils.d.ts.map