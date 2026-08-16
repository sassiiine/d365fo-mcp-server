/**
 * Symbol-counts worker thread.
 *
 * COUNT(*) / GROUP BY over the symbols table is a full index scan — on a
 * 2 GB production database with a cold OS file cache it takes 30-60+ seconds.
 * node:sqlite is synchronous, so running it on the main thread blocks the
 * event loop and the MCP server cannot answer tools/list or the first tool
 * call; the client (VS Code Copilot) times out after 60 s and kills the
 * server. Running the scan here, on a separate thread with its own read-only
 * connection, keeps the main thread free (WAL mode allows concurrent readers).
 *
 * Spawned by XppSymbolIndex.getSymbolCounts(); posts a single message:
 *   { ok: true, total, byType } | { ok: false, error }
 */
export {};
//# sourceMappingURL=symbolCountsWorker.d.ts.map