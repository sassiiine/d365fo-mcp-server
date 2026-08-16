/**
 * Workspace Detector
 * Automatically detects D365FO project paths from GitHub Copilot workspace
 */
export interface D365ProjectInfo {
    /** Path to the .rnrproj file. May be undefined when model was detected from PackagesLocalDirectory path. */
    projectPath?: string;
    modelName: string;
    /** Path to the VS solution folder. May be undefined when model was detected from PackagesLocalDirectory path. */
    solutionPath?: string;
    /** Base PackagesLocalDirectory path, if known */
    packagePath?: string;
    packageName?: string;
    /**
     * Every .rnrproj found when the workspace held more than one and none could be
     * resolved unambiguously. Set only on ambiguous results, where projectPath and
     * solutionPath are deliberately left undefined: the model is known (all
     * candidates agree on it) but the caller must pass projectPath explicitly for
     * anything that registers a file into a VS project.
     */
    ambiguousProjects?: string[];
    /**
     * Which of autoDetectD365Project's sources produced this result — the answer
     * to "why this model?", reported by `d365fo-mcp doctor` and recorded in the
     * detection status so a later success can retract an earlier warning (#833).
     */
    detectionSource?: string;
}
/**
 * Returns true when the model name is a well-known Microsoft tutorial/demo model
 * that should never be auto-selected as a custom project target.
 */
export declare function isMicrosoftDemoModel(modelName: string): boolean;
/**
 * Extract ModelName from .rnrproj file
 * Tries <Model> tag first (standard), then falls back to <ModelName>
 */
export declare function extractModelNameFromProject(projectPath: string): Promise<string | null>;
/**
 * Detect D365FO project information from workspace path
 * This is automatically called when GitHub Copilot provides workspace context
 *
 * When several .rnrproj files exist and none is unambiguously the intended one,
 * no project is selected — picking "the first one found" silently registered new
 * files into an arbitrary, unrelated VS project. The model name still resolves
 * whenever every candidate agrees on it (the common case: one model split across
 * several projects), so only project-registering operations are held back; those
 * results carry `ambiguousProjects` and no projectPath.
 */
export declare function detectD365Project(workspacePath: string, maxDepth?: number): Promise<D365ProjectInfo | null>;
/**
 * Auto-detect project from multiple possible workspace sources:
 * 1. Explicitly provided workspacePath parameter
 * 2. Current working directory (process.cwd())
 * 3. Environment variable WORKSPACE_PATH
 * 4. Well-known VS project directories (%USERPROFILE%\Documents\VS 2022\Projects, K:\VSProjects, K:\Projects, K:\repos, C:\VSProjects, C:\Projects)
 * 5. PackagesLocalDirectory path regex extraction (last resort, no .rnrproj)
 */
export declare function autoDetectD365Project(explicitWorkspacePath?: string): Promise<D365ProjectInfo | null>;
/**
 * Get the currently checked-out git branch name for a directory.
 * Returns null if the directory is not a git repository, git is unavailable,
 * or HEAD is detached (detached HEAD is unhelpful for project matching).
 */
export declare function detectGitBranch(workspaceRoot: string): Promise<string | null>;
/**
 * Scan a root directory for ALL D365FO projects (.rnrproj files).
 * Used when D365FO_SOLUTIONS_PATH is configured — lists every project available
 * so the user can pick the active one via get_workspace_info(projectPath).
 */
export declare function scanAllD365Projects(rootPath: string): Promise<D365ProjectInfo[]>;
//# sourceMappingURL=workspaceDetector.d.ts.map