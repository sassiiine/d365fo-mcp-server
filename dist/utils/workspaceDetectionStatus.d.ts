/**
 * What workspace detection resolved, and from which source.
 *
 * The detector used to warn from inside its own last fallback: "⚠️ Could not
 * auto-detect D365FO project from any source", printed roughly two seconds into
 * startup, before the sources it needs were up. Detection then succeeded by
 * another route — the packagePath scan, the solutions-path scan, .mcp.json — and
 * the warning stayed in the log, blaming configuration that was fine (#833).
 *
 * The detector therefore only RECORDS what it tried; whether that is worth a
 * warning is decided here, once, at the moment a caller actually needs a project
 * and every source has had its chance. A success recorded after a warning
 * retracts it, because a stale warning in a log is indistinguishable from a live
 * one.
 */
export interface WorkspaceDetectionStatus {
    /** True once any source produced a model. */
    resolved: boolean;
    /** Which source won — the answer to "why this model?". */
    source: string | null;
    modelName: string | null;
    projectPath: string | null;
    /** Sources the most recent unsuccessful pass looked at, in order. */
    tried: string[];
    /** Detection passes run so far (a retry after new sources appear is a second). */
    attempts: number;
    /** True once the unresolved warning has actually been printed. */
    warned: boolean;
}
/** A source produced a model. Retracts an earlier warning if one was printed. */
export declare function recordDetectionSuccess(source: string, modelName: string, projectPath?: string | null): void;
/**
 * A pass ended without a model. Deliberately silent: the sources it lists may
 * still come up, and reportUnresolvedDetection() decides when that has stopped
 * being plausible.
 */
export declare function recordDetectionFailure(tried: string[]): void;
/** The current state — for doctor, get_workspace_info and tests. */
export declare function getWorkspaceDetectionStatus(): Readonly<WorkspaceDetectionStatus>;
/**
 * Warn that no project could be detected — once, and only while that is still
 * true. Returns true when a warning was printed.
 */
export declare function reportUnresolvedDetection(): boolean;
/** One line for `d365fo-mcp doctor` and startup diagnostics. */
export declare function describeWorkspaceDetection(): string;
/** Test isolation, and a workspace switch that starts detection over. */
export declare function resetWorkspaceDetectionStatus(): void;
//# sourceMappingURL=workspaceDetectionStatus.d.ts.map