/**
 * Workspace utilities
 * Path validation and security helpers
 */
/**
 * Validate workspace path.
 * Ensures the path is safe and accessible, and that it resolves under one of
 * the configured D365FO package roots (not just a ".." substring check).
 */
export declare function validateWorkspacePath(workspacePath: string): Promise<{
    valid: boolean;
    error?: string;
}>;
//# sourceMappingURL=workspaceUtils.d.ts.map