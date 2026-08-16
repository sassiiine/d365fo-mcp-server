/**
 * Path containment guard for D365FO write operations.
 *
 * All D365FO XML objects live at the canonical path:
 *   <PackagesLocalDirectory>/<Package>/<Model>/Ax<Type>/<Name>.xml
 *
 * UDE layout is analogous under the custom packages root.
 *
 * This guard ensures that any file path the server is asked to write to
 * actually resolves underneath one of the configured package roots AND
 * contains the expected `/<Package>/<Model>/Ax*` segment shape. It prevents:
 *   - path traversal via explicit filePath / sourcePath JSON
 *   - writes to arbitrary locations on the host (repos, system dirs, etc.)
 *   - silent drift between the "resolved model" and the actual on-disk model
 *
 * Security-wise this is the single authoritative place that decides whether
 * a given absolute path is an acceptable write target.
 */
export interface PathContainmentResult {
    ok: boolean;
    /** When ok=false, human-readable reason. */
    reason?: string;
    /** When ok=true, the canonical absolute path with on-disk casing applied. */
    canonicalPath?: string;
    /** Matched root (for diagnostics). */
    matchedRoot?: string;
    /** `<Package>` segment of the canonical layout, when ok. */
    packageSegment?: string;
    /**
     * `<Model>` segment of the canonical layout, when ok — the model that actually
     * OWNS the file. Package and model differ whenever one package carries several
     * models, so ownership decisions (see crossModelWriteGuard) must read this and
     * not the package name.
     */
    modelSegment?: string;
}
/**
 * Validate that `filePath` points at a D365FO AOT file inside an allowed root
 * and matches the canonical `<root>/<Package>/<Model>/Ax<Type>/<Name>.xml` shape.
 *
 * `modelHint` (optional) is the model name the caller expects to modify; when
 * provided we additionally require the path's model segment to match it
 * (case-insensitive). This catches the agent-steered attack where `modelName`
 * is one value but `filePath` points into a different (standard) model.
 */
export declare function assertWritePathAllowed(filePath: string, modelHint?: string, opts?: {
    extraRoots?: (string | null | undefined)[];
}): Promise<PathContainmentResult>;
/** Throwing wrapper — convenient in tool handlers. */
export declare function ensureWritePathAllowed(filePath: string, modelHint?: string, opts?: {
    extraRoots?: (string | null | undefined)[];
}): Promise<string>;
/**
 * Validate that `dirPath` is a directory inside one of the configured D365FO
 * package roots. Used as the read-side equivalent of `assertWritePathAllowed`
 * for workspace-scanning operations (`workspacePath` tool parameter).
 *
 * Prevents path traversal and arbitrary directory reads: any absolute path that
 * does NOT resolve under a configured package root is rejected outright.
 */
export declare function assertReadRootAllowed(dirPath: string): Promise<PathContainmentResult>;
/**
 * Check that a single file path (e.g. a glob result) still resolves under
 * `rootDir` after symlink resolution. Call this on every file returned by
 * a glob that was rooted at a validated workspace path — a symlink inside
 * the workspace could otherwise redirect a read outside the allowed root.
 */
export declare function isFileUnderRoot(filePath: string, rootDir: string): boolean;
//# sourceMappingURL=pathContainment.d.ts.map