import type { XppServerContext } from '../../types/context.js';
/**
 * Containment check for the undo target, using the same lexical-OR-realpath rule the
 * write path applies (utils/pathContainment.isUnder).
 *
 * A D365FO model directory under PackagesLocalDirectory is commonly a symlink to a
 * repo checkout, and `git rev-parse --show-toplevel` answers with the RESOLVED root.
 * A purely lexical path.relative() between the two therefore climbs out of the repo
 * ("..\\..\\…") and undo refused every file reached through the symlink — the write
 * path was fixed for exactly this and undo was left behind.
 *
 * Exported for unit tests.
 */
export declare function isInsideRepo(repoRoot: string, targetPath: string): boolean;
/**
 * Repo-relative path of the undo target. Prefers the lexical form (it preserves the
 * casing/spelling git already knows) and falls back to comparing both sides resolved,
 * which is the form that works when the target was reached through a symlinked
 * package or model directory.
 *
 * Exported for unit tests.
 */
export declare function toRepoRelative(repoRoot: string, absolutePath: string): string;
export declare const undoLastModificationTool: (params: any, context: XppServerContext) => Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=undoLastModification.d.ts.map