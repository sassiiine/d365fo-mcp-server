/**
 * Session-scoped ledger of files that d365fo_file(action="create") wrote to disk
 * for the FIRST time in this MCP server process.
 *
 * Why this exists: undo_last_modification is git-based. It reverts tracked files
 * with `git checkout` and deletes git-untracked files after proving they are
 * untracked. But the D365FO sandbox (K:\AosService\PackagesLocalDirectory) is NOT
 * a git repository, so `git rev-parse --show-toplevel` fails and undo cannot roll
 * back anything there — the exact per-run rollback the eval loop mandates.
 *
 * This ledger is undo's authoritative, safe answer for the non-git case: undo may
 * delete a file ONLY when the create tool recorded creating it here this session.
 * It is deliberately in-memory (a module singleton shared by every tool in the
 * process) and records ONLY genuinely-new files (the create path gates recording
 * on "the file did not already exist on disk"), so undo can never delete a file
 * the tool merely overwrote or a pre-existing/unrelated file.
 *
 * Corpus evidence: eval/corpus/runs/2026-07-21T__L3-custom-service-basic__a2a4131.json
 * (finding A — undo returns "File is not inside a git repository" for every sandbox
 * write).
 */
export interface CreatedArtifact {
    /** Absolute path of the created XML file, as written to disk. */
    filePath: string;
    /** AOT object type (e.g. "class", "service") — used to clean the .rnrproj. */
    objectType?: string;
    /** Resolved AOT object name — used to locate the .rnrproj <Content Include>. */
    objectName?: string;
    /** Absolute path of the .rnrproj the file was added to, when known. */
    projectPath?: string;
}
/**
 * Normalize a path to a case-insensitive, separator-agnostic key.
 *
 * We deliberately do NOT use path.resolve(): the created paths are already
 * absolute Windows paths, and resolve() would prepend a drive letter to
 * POSIX-style inputs when the server runs off-Windows (same reasoning as
 * undoLastModification's own path handling).
 */
export declare function ledgerKey(filePath: string): string;
/** Record a genuinely-new file the create tool just wrote. */
export declare function recordCreatedArtifact(entry: CreatedArtifact): void;
/** Look up whether THIS session created `filePath`; undefined if not recorded. */
export declare function lookupCreatedArtifact(filePath: string): CreatedArtifact | undefined;
/** Drop a ledger entry once it has been undone (or is no longer relevant). */
export declare function forgetCreatedArtifact(filePath: string): void;
/** addToProject added the `<Folder Include>` entry itself (it was absent). */
export declare function recordCreatedProjectFolder(projectPath: string, displayFolderName: string): void;
/** True only when this session added that folder entry; consumes the record. */
export declare function takeCreatedProjectFolder(projectPath: string, displayFolderName: string): boolean;
/** Test-only: reset the module singletons between cases. */
export declare function _clearCreatedArtifactLedger(): void;
//# sourceMappingURL=createdArtifactLedger.d.ts.map