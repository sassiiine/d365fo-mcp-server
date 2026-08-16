/**
 * Index staleness detection.
 *
 * Compares the newest XML mtime in the active model's metadata folder with
 * the index's last_indexed_at timestamp and produces a warning when the
 * workspace has changed since the last (re)index.
 */
/** Drop cached scans (test isolation, or after a known workspace write). */
export declare function resetMetadataMtimeCache(): void;
export interface MtimeScanResult {
    /** Epoch ms of the newest .xml/.label.txt file found */
    newestMtime: number;
    newestFile: string;
    scannedFiles: number;
    /** True when the scan stopped at MAX_SCANNED_FILES */
    truncated: boolean;
}
/**
 * Recursively find the newest metadata file mtime under rootDir.
 * Returns null when the directory does not exist or contains no metadata files.
 *
 * Cached for SCAN_CACHE_MS per root — see that constant for why.
 */
export declare function findNewestMetadataMtime(rootDir: string): MtimeScanResult | null;
export interface StalenessReport {
    status: 'fresh' | 'stale' | 'unknown';
    /** Full "## Index Freshness" section — diagnostics=true only. */
    lines: string[];
    /**
     * Compact default: one `Index : …` line, and the fix only when the index is
     * actually stale. The scan detail (newest file, files scanned) is diagnostics
     * material — it changes nothing about what the agent should do next.
     */
    compactLines: string[];
}
/**
 * Compare workspace mtimes against the index timestamp and render a report
 * section for get_workspace_info.
 */
export declare function checkIndexStaleness(lastIndexedAt: string | null, modelMetadataDir: string | null): StalenessReport;
//# sourceMappingURL=indexStaleness.d.ts.map