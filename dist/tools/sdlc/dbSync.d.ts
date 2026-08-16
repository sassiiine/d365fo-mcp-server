import { type DbLike } from '../../utils/symbolLookup.js';
/** What kind of object a sync target is — reported, not routed on. */
type SyncKind = 'table' | 'view';
/** A syncable object plus what kind it is. */
interface SyncTarget {
    name: string;
    kind: SyncKind;
}
/**
 * Extract syncable object names from a .rnrproj project file, tagged with the
 * SyncEngine list they belong in. Looks for Content Include entries like
 * "AxTable\MyTable", "AxView\MyView", "AxTableExtension\MyExt", etc. — the AOT
 * folder is authoritative for the table/view split.
 */
export declare function extractTablesFromProject(projectPath: string): Promise<SyncTarget[]>;
/**
 * Label explicitly named objects as table or view using the symbol index, so the
 * tool can report what it actually synced. Both kinds go into the same
 * `-synclist`, so a wrong label costs nothing but an inaccurate summary; an
 * unknown name is reported as such rather than silently called a table.
 */
export declare function classifySyncTargets(names: string[], db: DbLike | undefined): {
    targets: SyncTarget[];
    unresolved: string[];
};
/**
 * Build the SyncEngine command line. Pure, so the argument shape can be gated by
 * a test instead of only by a 3-minute run against a live AxDB.
 *
 * `targets` empty ⇒ full sync. Tables and views share `-synclist`; `-viewlist`
 * must never appear (see SYNCABLE_AOT_FOLDERS for the verified reason).
 */
export declare function buildSyncEngineArgs(opts: {
    targets: SyncTarget[];
    syncViews: boolean;
    metadataBinPath: string;
    connStr: string;
}): string[];
/**
 * Decide whether a SyncEngine run actually succeeded.
 *
 * The old test — "any line contains error/failed/exception" — reported ❌ for a
 * sync that completed cleanly, because SyncEngine logs a benign startup warning
 * on this environment (`Log level - Warning | Failed to abort paused
 * PostServiceync resumable index from last run: SqlException … Invalid column
 * name 'DEFERREDOPERATIONSTATE'`) before it does any work. Every partial sync on
 * this VM tripped it, so a green run was indistinguishable from a red one.
 *
 * SyncEngine states its own verdict: it prints `<SyncMode> finished` and
 * `Sync finished and took <n> milliseconds` only on a completed run. Take that
 * as the signal, and keep two overrides that a completion line must not hide:
 * a rejected argument (which is silently ignored — how the bogus `-viewlist`
 * went unnoticed) and an explicit failure/abort line.
 */
export declare function classifySyncOutcome(rawOutput: string): {
    succeeded: boolean;
    reason: string;
};
export declare const dbSyncTool: (params: any, context: any) => Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
export {};
//# sourceMappingURL=dbSync.d.ts.map