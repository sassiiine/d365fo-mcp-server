/**
 * Locate an AOT object's XML file on disk, by type and name.
 *
 * This lived in the MODIFY tool, and four read-only tools (tableInfo, enumInfo,
 * queryInfo, viewInfo) imported it from there — so reading a table pulled in the
 * whole write path, its bridge adapter and its op-spec registry. It answers a
 * question about where metadata lives, which is a util's job, not a tool's.
 */
/**
 * Filesystem fallback for findD365File.
 * Constructs the expected AOT file path from config/env and checks if it exists on disk.
 * This handles objects that were just created and are not yet indexed in the symbol database.
 */
export declare function findD365FileOnDisk(objectType: string, objectName: string, modelName?: string, explicitPackagePath?: string): Promise<string | null>;
//# sourceMappingURL=objectFileLookup.d.ts.map