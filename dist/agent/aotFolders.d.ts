/**
 * AOT object type -> metadata folder name.
 *
 * Extracted so the thin agent can resolve a write target without importing
 * objectFileLookup, which pulls in the config manager and the package resolver.
 * The agent is deliberately allowed to know only this.
 */
export declare const AOT_FOLDERS: Record<string, string>;
/** Folder for an object type, or null when the type is unknown. */
export declare function aotFolder(objectType: string): string | null;
//# sourceMappingURL=aotFolders.d.ts.map