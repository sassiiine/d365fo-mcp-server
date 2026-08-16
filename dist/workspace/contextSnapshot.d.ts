/**
 * Workspace Context Snapshot
 *
 * Phase 1 of the "context pipeline": a single, curated snapshot of what the
 * developer is currently working on. Assembled from the pieces the server
 * already knows about — the config manager (model/project/env/roots), the
 * symbol index (stats + freshness), the workspace scanner (recently edited
 * objects by mtime) and git (uncommitted X++ changes).
 *
 * This module is the shared source of truth consumed by BOTH:
 *   • the MCP resource layer (workspace://context, workspace://stats, …), and
 *   • the get_workspace_info tool (its "Context Snapshot" section).
 *
 * It is deliberately pull-based and best-effort: every external call is guarded
 * so a missing git binary, a non-repo workspace or an unbuilt index can never
 * break the caller. MCP cannot push context into the model's prompt, so the
 * value here is making a high-signal default context one cheap call away.
 */
import type { XppServerContext } from '../types/context.js';
import type { WorkspaceFile } from './workspaceScanner.js';
export interface RecentObject {
    name: string;
    type: WorkspaceFile['type'];
    path: string;
    modifiedAt: string;
}
/**
 * Best-effort "what the developer is working on now". MCP exposes workspace
 * roots, not editor focus, so this is the most-recently-modified X++ object —
 * a good proxy for the active file, not a guarantee of editor cursor state.
 */
export type ActiveObject = RecentObject;
export interface ContextSnapshot {
    model: string | null;
    modelSource: string;
    projectPath: string | null;
    workspacePath: string | null;
    envType: string;
    roots: string[];
    index: {
        totalSymbols: number;
        byType: Record<string, number>;
        indexedModels: string[];
        lastIndexedAt: string | null;
    };
    /**
     * Most-recently modified X++ object — proxy for the active file. Null when no
     * workspace/files are detected. See ActiveObject for the editor-focus caveat.
     */
    activeObject: ActiveObject | null;
    /** Most-recently edited X++ objects in the workspace (mtime desc). */
    recentObjects: RecentObject[];
    /** X++ files changed vs HEAD (uncommitted), relative to the repo root. */
    uncommittedFiles: string[];
    generatedAt: string;
}
/**
 * Build the curated workspace context snapshot. Every section degrades
 * gracefully — a failure in one source leaves the others intact.
 */
export declare function buildContextSnapshot(context: XppServerContext): Promise<ContextSnapshot>;
/**
 * The same "live" portion as renderContextSnapshotSection, folded into at most
 * two lines for get_workspace_info's default output. Names only enough recent
 * objects to orient the agent — the full list, with timestamps and every
 * uncommitted path, stays behind diagnostics=true and review_workspace_changes.
 */
export declare function renderContextSnapshotCompact(snapshot: ContextSnapshot): string[];
export declare function renderContextSnapshotSection(snapshot: ContextSnapshot): string[];
//# sourceMappingURL=contextSnapshot.d.ts.map