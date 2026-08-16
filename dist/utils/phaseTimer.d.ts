/**
 * Phase timings for one write, reported in the write's own reply when it was
 * slow.
 *
 * A tool call that takes 95 s to create an enum is a fact the transcript
 * records and nobody can act on: the response says only that it succeeded, and
 * the aggregate metrics cannot attribute one call. Naming the phases turns
 * "the server is sometimes slow" into "the bridge call was 92 s of it".
 *
 * Silent below the threshold, so a normal write's reply is unchanged.
 */
export interface PhaseTimer {
    /** Run `fn`, recording how long it took under `name`. */
    time<T>(name: string, fn: () => Promise<T>): Promise<T>;
    /** Record a phase measured elsewhere. */
    add(name: string, ms: number): void;
    /** Total elapsed since the timer was created. */
    totalMs(): number;
    /** A `⏱️` block, or '' when the call was quick enough not to matter. */
    render(thresholdMs?: number): string;
}
export declare function createPhaseTimer(): PhaseTimer;
//# sourceMappingURL=phaseTimer.d.ts.map