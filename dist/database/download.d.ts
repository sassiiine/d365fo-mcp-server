/**
 * Azure Blob Storage Database Download Utility
 * Downloads SQLite database from Azure Blob Storage on startup
 */
interface DownloadOptions {
    connectionString?: string;
    containerName?: string;
    blobName?: string;
    localPath?: string;
    maxRetries?: number;
    timeoutMs?: number;
}
/**
 * Move a validated download over the live database file.
 *
 * A bare rename() replaces only the .db. The PREVIOUS database's -wal and -shm are
 * left sitting next to it, and SQLite treats a -wal it finds beside a database as
 * that database's own journal: on the next open it replays pages from the old
 * generation into the freshly downloaded file, which reports as corruption or, worse,
 * as silently resurrected rows. They are removed BEFORE the rename, so a crash in
 * the middle leaves the old database without a journal it no longer needs rather
 * than the new database with a journal that does not belong to it.
 *
 * Exported for unit tests.
 */
export declare function swapDownloadedDatabase(tmpPath: string, finalPath: string): Promise<void>;
export declare function downloadDatabaseFromBlob(options?: DownloadOptions): Promise<string>;
/**
 * Check local database version against blob storage
 */
export declare function checkDatabaseVersion(localPath: string, options?: DownloadOptions): Promise<{
    needsUpdate: boolean;
    localModified?: Date;
    remoteModified?: Date;
}>;
/**
 * Initialize database (download if needed)
 */
export declare function initializeDatabase(options?: DownloadOptions): Promise<string>;
export {};
//# sourceMappingURL=download.d.ts.map