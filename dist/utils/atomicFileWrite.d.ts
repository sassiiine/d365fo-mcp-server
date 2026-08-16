/**
 * Crash-safe, serialized replacement of files the direct-XML write path edits.
 *
 * Every direct-XML fallback in modifyD365File is a read-modify-write over a whole
 * AOT file. Two failure modes follow from doing that with a plain fs.writeFile:
 *
 *  - Truncation. writeFile opens the target with O_TRUNC, so a crash, a full disk
 *    or a killed process between the truncate and the last chunk leaves a partial
 *    XML file. The object's only copy on disk is then unparseable to both the
 *    compiler and the bridge, and there is nothing left to recover it from.
 *  - Lost updates. Two edits of the same file that overlap both read the same
 *    original and the later write discards the earlier one's element outright.
 *    `d365fo_file` is deliberately excluded from the in-flight call dedup (writes
 *    must never be coalesced), so concurrent identical modifies do reach here.
 *
 * writeFileAtomic closes the first by writing a sibling temp file and renaming it
 * over the target — rename is atomic, so a reader sees either the whole old file or
 * the whole new one. withFileLock closes the second by serializing whole
 * read-modify-write sequences per path.
 *
 * Scope: in-process. This does not coordinate with a second server process or with
 * Visual Studio holding the same file — that would need the filesystem locks in
 * operationLocks.ts, which are far too heavy for a per-file edit.
 */
/**
 * Run `fn` with exclusive access to `filePath` relative to other withFileLock
 * callers. Queued in FIFO order; a rejection in one holder does not poison the
 * queue, and the map entry is dropped once the last waiter is done so a long-lived
 * process does not accumulate one entry per file ever edited.
 */
export declare function withFileLock<T>(filePath: string, fn: () => Promise<T>): Promise<T>;
/**
 * Replace `filePath`'s contents by writing a temp sibling and renaming it over the
 * target. The temp file is a sibling (not in os.tmpdir()) because rename is only
 * atomic within one filesystem, and the package directory is routinely on a
 * different volume than the temp directory.
 */
export declare function writeFileAtomic(filePath: string, content: string): Promise<void>;
//# sourceMappingURL=atomicFileWrite.d.ts.map