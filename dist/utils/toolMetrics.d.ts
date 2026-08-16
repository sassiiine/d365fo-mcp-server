/**
 * Lightweight in-memory tool usage metrics.
 *
 * Tracks per-tool call counts, total latency, and empty-result counts.
 * Stats are logged to stderr periodically and exposed via getMetricsSnapshot().
 * All state is in-process only — resets on server restart.
 */
/** Log a single tool call that ran long enough to be worth attributing. */
export declare function reportSlowCall(toolName: string, elapsedMs: number, args?: unknown): void;
/** Call before dispatching a tool. Returns a finish() callback. */
export declare function recordToolStart(toolName: string): (isEmpty: boolean) => void;
/**
 * Record a call in the sequence buffer and return the number of occurrences
 * of this exact tool+args combination within the recent window (including
 * the call just recorded). 1 = first occurrence, 3+ = likely loop.
 */
export declare function recordCallSequence(toolName: string, argsKey: string): number;
/** Test/maintenance helper — clears the sequence buffer. */
export declare function resetCallSequence(): void;
/** Returns a snapshot of current metrics sorted by call count descending. */
export declare function getMetricsSnapshot(): Array<{
    tool: string;
    calls: number;
    avgLatencyMs: number;
    emptyRatio: number;
    duplicateCalls: number;
}>;
/**
 * Start periodic logging of metrics to stderr.
 * Safe to call multiple times — only the first call starts the interval.
 * @param intervalMs default 5 minutes
 */
export declare function startMetricsLogging(intervalMs?: number): void;
//# sourceMappingURL=toolMetrics.d.ts.map