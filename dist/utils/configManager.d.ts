/**
 * MCP Configuration Manager
 * Loads and provides access to .mcp.json configuration
 */
import { type D365ProjectInfo } from './workspaceDetector.js';
import { type XppEnvironmentConfig } from './xppConfigProvider.js';
export interface McpContext {
    workspacePath?: string;
    packagePath?: string;
    modelName?: string;
    customPackagesPath?: string;
    microsoftPackagesPath?: string;
    projectPath?: string;
    solutionPath?: string;
    devEnvironmentType?: 'auto' | 'traditional' | 'ude';
    bridgeLogFile?: string;
}
export interface McpConfig {
    /** Top-level context — preferred location (avoids VS 2022 treating it as an MCP server). */
    context?: McpContext;
    servers: {
        [key: string]: any;
        /** @deprecated Put context at top level instead. Kept for backward compatibility. */
        context?: McpContext;
    };
}
declare class ConfigManager {
    private config;
    private configPath;
    private runtimeContext;
    private configuredModelsRegistered;
    /**
     * Per-request context storage — isolates each HTTP request's workspace path
     * from concurrent requests. Populated via runWithRequestContext() in transport.ts.
     * Takes priority over runtimeContext in getContext().
     */
    private requestContextStorage;
    private autoDetectedProject;
    private autoDetectionAttempted;
    private autoDetectionCache;
    private allDetectedProjects;
    private workspaceProjectCandidates;
    private detectionGeneration;
    private allDetectedProjectsReady;
    private detectionInProgress;
    private xppConfigProvider;
    private xppConfig;
    private xppConfigLoaded;
    private toolForcedProject;
    private lastDetectionFingerprint;
    private detectionRetried;
    constructor(configPath?: string);
    /**
     * Start scanning D365FO_SOLUTIONS_PATH immediately at startup (fire-and-forget).
     * Stores a Promise so setRuntimeContextFromRoots() can await it, guaranteeing
     * allDetectedProjects is populated before the first roots/list notification.
     * Safe to call multiple times; subsequent calls are no-ops.
     */
    initEagerScan(): void;
    /**
     * Auto-detect D365FO project from workspace.
     * Called automatically when projectPath/solutionPath is requested but not configured.
     * Results are cached per workspace path.
     */
    private autoDetectProject;
    /**
     * The detection sources available right now, as a comparable string.
     *
     * A first pass that ran before the workspace roots / packagePath arrived looked
     * at strictly less than a later one would — that is the race behind the boot
     * warning (#833). A change in this fingerprint is what makes a retry worth the
     * filesystem scan; an unchanged one would repeat the same walk for the same
     * answer.
     */
    private detectionSourceFingerprint;
    /**
     * Run workspace detection if it has not run yet, and re-run it once when the
     * first pass came up empty and a source it needs has appeared since.
     *
     * The first pass fires roughly two seconds into startup, before the bridge and
     * the workspace roots are up; treating its result as final is what made the
     * server report "could not auto-detect" for a workspace it went on to resolve
     * moments later (#833). Only when the retry has also failed — and a caller
     * actually needs a project — is the warning emitted.
     */
    private ensureProjectDetection;
    /**
     * Set runtime context (e.g., from GitHub Copilot workspace detection)
     * This allows dynamic context that overrides .mcp.json configuration
     * PERFORMANCE: Uses cache, only resets when workspace differs from cached value.
     */
    setRuntimeContext(context: Partial<McpContext>): void;
    /**
     * Called by mcpServer when roots/list arrives (all roots from VS 2022 / VS Code).
     * Tries every root path to find an unambiguous project match.
     *
     * Detection order:
     *   1. Exact/contained path match (workspace IS or is INSIDE a project dir)
     *   2. Git branch name → project name substring match
     *      (handles VS 2022 sending solution root K:\repos\Contoso for ALL projects;
     *       branch feature/4105-ContosoBankPaymProposal → matches model "ContosoBank")
     *   3. BFS fallback
     */
    setRuntimeContextFromRoots(rootPaths: string[]): Promise<void>;
    /**
     * Find the project whose model name appears as a substring of the git branch name.
     * Prefer the LONGEST match to avoid short-prefix false positives
     * (e.g. "Con" would match everything; "ContosoBank" is more specific than "Contoso").
     *
     * Examples:
     *   branch "feature/4105-ContosoBankPaymProposal"  → model "ContosoBank"  (prefix of "ContosoBankPaymProposal")
     *   branch "feature/ContosoEDS-cleanup"             → model "ContosoEDS"
     */
    private findProjectByBranchName;
    /**
     * Find the single unambiguous project that corresponds to a workspace path.
     * Returns null when:
     *   - no known projects (allDetectedProjects is empty)
     *   - workspace is a BROAD ancestor that contains MULTIPLE projects (ambiguous)
     *
     * Only returns a project when the match is specific:
     *   a) workspace == project directory (exact)
     *   b) workspace is INSIDE the project directory (workspace is a sub-folder)
     *   c) workspace is DIRECT parent of EXACTLY ONE project (unambiguous ancestor)
     */
    private matchProjectForWorkspace;
    /**
     * Clear runtime context
     */
    clearRuntimeContext(): void;
    /**
     * Find .mcp.json file.
     * Priority:
     * 1. MCP_CONFIG_PATH env var (explicit override)
     * 2. User home directory — single canonical config location (~/.mcp.json)
     * 3. Current directory and up to 5 parent directories (project-specific override, rare)
     * 4. Current directory fallback (file may not exist yet)
     */
    private findConfigFile;
    /**
     * Load configuration from .mcp.json file.
     * Idempotent — skips re-reading if config is already loaded.
     * Call ensureLoaded() for lazy initialization.
     */
    load(): Promise<McpConfig | null>;
    /**
     * Ensure config is loaded — lazy initializer.
     * Safe to call multiple times; loads only once.
     */
    ensureLoaded(): Promise<void>;
    /**
     * Get context configuration
     * Merges .mcp.json config with runtime context (runtime takes priority)
     */
    getContext(): McpContext | null;
    /**
     * Run fn inside an isolated per-request AsyncLocalStorage context.
     * All calls to getContext() within fn (and any awaited Promises it starts)
     * will see ctx merged over runtimeContext, without mutating shared state.
     */
    runWithRequestContext<T>(ctx: Partial<McpContext>, fn: () => Promise<T>): Promise<T>;
    /**
     * Returns true when the current async call stack runs inside a request-scoped
     * AsyncLocalStorage context. HTTP transport uses this for per-request
     * isolation, so callers should avoid mutating the shared runtimeContext.
     */
    hasRequestContext(): boolean;
    /**
     * Returns true when the static configuration (`.mcp.json` + `D365FO_*` env vars)
     * already provides enough workspace context to work without calling `roots/list`.
     *
     * In instanced mode every project has its own dedicated server instance whose
     * config contains both a model name and at least one path. Calling `roots/list`
     * is then unnecessary and causes a -32001 timeout when `mcp-remote` is the
     * transport (it has a hard-coded 60 s request timeout and cannot complete a
     * server-initiated request over HTTP). In instanced mode the workspace is also
     * immutable per instance, so `roots_list_changed` notifications are irrelevant.
     *
     * Awaits `ensureLoaded()` so it is safe to call before the first tool invocation.
     */
    isStaticallyConfigured(): Promise<boolean>;
    /**
     * Get workspace path from configuration
     * Returns the base PackagesLocalDirectory path if workspacePath contains it
     */
    getPackagePath(): string | null;
    /**
     * Get workspace path (specific model path)
     */
    getWorkspacePath(): string | null;
    /**
     * Get model name from the last segment of workspacePath.
     * Supports both path formats:
     *   K:\AOSService\PackagesLocalDirectory\MyPackage\MyModel → "MyModel"
     *   K:\AOSService\PackagesLocalDirectory\MyModel           → "MyModel"
     * This allows automatic model detection on non-Windows (Azure) without D365FO_MODEL_NAME env var.
     */
    getModelNameFromWorkspacePath(): string | null;
    /**
     * Get package name from workspacePath when it follows the two-level format:
     *   K:\AOSService\PackagesLocalDirectory\YourPackageName\YourModelName → "YourPackageName"
     * Returns null for one-level paths or when workspacePath is not set.
     */
    getPackageNameFromWorkspacePath(): string | null;
    /**
     * Get model name from configuration.
     * Priority:
     *   1) Explicit modelName in mcp.json context
     *   2) Last segment of workspacePath — ONLY when path contains PackagesLocalDirectory
     *      (AOT paths like K:\AosService\PackagesLocalDirectory\MyModel).
     *      Skipped for solution/repo paths like K:\repos\Contoso — those would wrongly
     *      return "Contoso" instead of the real model name from the .rnrproj file.
     *   3) Auto-detected model name from .rnrproj scan
     *   4) D365FO_MODEL_NAME env var
     */
    getModelName(): string | null;
    /**
     * Get model name together with its detection source for diagnostics.
     * Mirrors the exact priority chain of getModelName() but also returns
     * a human-readable source string for display in get_workspace_info.
     */
    getModelNameWithSource(): {
        modelName: string | null;
        source: string;
    };
    /**
     * Returns all workspace-info diagnostics in one async call, including
     * the human-readable source for each resolved value.
     * Used by the get_workspace_info tool to produce the Phase-5 diagnostics output.
     */
    getWorkspaceInfoDiagnostics(): Promise<{
        modelName: string | null;
        modelSource: string;
        isModelSourceAutoDetected: boolean;
        projectPath: string | null;
        projectSource: string;
        packagePath: string | null;
        packageSource: string;
        customPackagesPath: string | null;
        customPackagesSource: string;
    }>;
    /**
     * Returns all projects discovered by the D365FO_SOLUTIONS_PATH scan.
     * Used by get_workspace_info to list available projects for solution switching.
     */
    getAllDetectedProjects(): D365ProjectInfo[];
    /**
     * Every .rnrproj that builds `modelName`, as paths.
     *
     * One model is split across as many projects as its owner wants — fifteen, in
     * the solution that surfaced this — and one object may be referenced by
     * several of them. Anything asking "is this object registered in a project?"
     * has to ask all of them, or a file that compiles perfectly reads as missing
     * from the build. See workspace/projectMembership.ts.
     */
    getProjectsForModel(modelName: string | null | undefined): string[];
    /**
     * The .rnrproj files found in the WORKSPACE when auto-detection refused to pick
     * one of them. Empty whenever a project was resolved — these are the concrete
     * alternatives createD365File names when addToProject has no projectPath to use.
     *
     * Not the same list as getAllDetectedProjects(): that one spans every solution
     * under D365FO_SOLUTIONS_PATH and would answer "which projects exist anywhere",
     * not "which projects is this workspace ambiguous between".
     */
    getWorkspaceProjectCandidates(): D365ProjectInfo[];
    /**
     * Explicitly force a specific .rnrproj as the active project.
     * Called when the user passes projectPath to get_workspace_info() to switch solutions.
     * Bypasses the auto-detection cache — takes effect immediately.
     */
    forceProject(projectPath: string): Promise<D365ProjectInfo | null>;
    /**
     * Wait for an in-flight workspace detection, so a caller that needs the
     * workspace's OWN model does not read null while the background scan is still
     * running. Bounded the same way getWorkspaceInfoDiagnostics() bounds it.
     */
    private awaitPendingDetection;
    /**
     * The model WRITES are anchored to — normally the active model, but after a
     * tool-initiated project switch it stays the model the workspace resolved to
     * on its own.
     *
     * A switch changes which project is ACTIVE — which one gets built, BP-checked
     * and written into. It was never needed for reading: get_object_info, search,
     * find_references and the rest query the symbol index across every model and
     * never consult the active model at all.
     *
     * `get_workspace_info(projectName=…)` is a tool call the agent can make for
     * itself, so letting it move the write target would hand the agent the very
     * self-served consent the cross-model guard exists to deny: refused on
     * "table X lives in another model" → switch project → same write, no refusal.
     * A genuine workspace change (roots/list, git branch) clears the anchor,
     * because then the user really did move.
     */
    getWriteAnchorModel(): string | null;
    /**
     * The same anchor, with project detection awaited first — what every write
     * guard must use.
     *
     * getWriteAnchorModel() is synchronous, and in a workspace that configures no
     * `modelName` and sits outside PackagesLocalDirectory its ONLY source is
     * `autoDetectedProject`, a field a background .rnrproj scan fills in. Read
     * before that scan lands it returns null — and a null anchor makes the
     * cross-model guard stand down by design ("never block on a guess"). That
     * leaves a guard which is present, correct, and occasionally simply absent,
     * decided by a race nobody can see. get_workspace_info never had the problem
     * because it awaits the scan; the guards did not.
     *
     * The common path costs nothing: an anchor already known short-circuits before
     * the await.
     */
    resolveWriteAnchorModel(): Promise<string | null>;
    /** The in-effect tool project switch, or null when writes and reads agree. */
    getToolProjectSwitch(): {
        anchorModel: string;
        forcedModel: string;
    } | null;
    /**
     * Get project path
     * Priority: 1) Runtime context 2) .mcp.json config 3) Auto-detection from workspace
     */
    getProjectPath(): Promise<string | null>;
    /**
     * Get solution path
     * Priority: 1) Runtime context 2) .mcp.json config 3) Auto-detection from workspace
     */
    getSolutionPath(): Promise<string | null>;
    /**
     * Returns a snapshot of the currently detected project for diagnostic logging.
     * All fields are resolved synchronously from the in-memory state — no async I/O.
     */
    getDetectionSummary(): {
        modelName: string | null;
        source: string;
        projectPath: string | null;
        solutionPath: string | null;
        workspacePath: string | null;
    };
    /**
     * Returns ONLY the model name found by scanning .rnrproj files on disk,
     * ignoring whatever is written in .mcp.json / env vars.
     * Useful when the configured modelName is a placeholder and we want to suggest
     * the real model to the user.
     */
    getRawAutoDetectedModelName(): Promise<string | null>;
    /**
     * Get auto-detected model name
     * Returns the model name discovered through auto-detection.
     * Skips the scan when modelName is already configured — avoids needless filesystem traversal.
     */
    getAutoDetectedModelName(): Promise<string | null>;
    /**
     * Get the resolved dev environment type.
     * Priority: 1) Explicit env var 2) .mcp.json context 3) Auto-detect
     */
    getDevEnvironmentType(): Promise<'traditional' | 'ude'>;
    /**
     * Get the custom packages path (UDE: ModelStoreFolder).
     */
    getCustomPackagesPath(): Promise<string | null>;
    /**
     * Get the Microsoft packages path (UDE: FrameworkDirectory).
     */
    getMicrosoftPackagesPath(): Promise<string | null>;
    /**
     * Get the full active XPP environment config, including ReferencePackagesPaths.
     * Returns null when no XPP config exists (CHE / non-UDE environment).
     */
    getActiveXppConfig(): Promise<XppEnvironmentConfig | null>;
    /**
     * Get the cross-reference database server (UDE: CrossReferencesDbServerName).
     */
    getXrefDbServer(): Promise<string | null>;
    /**
     * Get the cross-reference database name (UDE: CrossReferencesDatabaseName).
     */
    getXrefDbName(): Promise<string | null>;
    private ensureXppConfig;
}
/**
 * Get or create ConfigManager instance
 */
export declare function getConfigManager(configPath?: string): ConfigManager;
/**
 * Initialize configuration (load from file)
 */
export declare function initializeConfig(configPath?: string): Promise<McpConfig | null>;
/**
 * Fallback package path when configManager.getPackagePath() returns null.
 * This only happens when no config is loaded AND the drive scan found no
 * AosService\PackagesLocalDirectory on any volume. The value is a safe
 * sentinel — callers get a clear 'file not found' naming a real D365FO
 * location rather than an empty path, and never a silently wrong drive.
 */
export declare function fallbackPackagePath(): string;
/**
 * Extract the package name from a D365FO file path.
 * Standard AOT layout: .../PackagesLocalDirectory/{Package}/{Model}/Ax{Type}/{Name}.xml
 * Returns the package name (first segment after PackagesLocalDirectory), or null.
 * The package name is what isStandardModel() checks against (e.g. ApplicationSuite).
 */
export declare function extractModelFromFilePath(filePath: string): string | null;
export {};
//# sourceMappingURL=configManager.d.ts.map