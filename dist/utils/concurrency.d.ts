/**
 * Bounded-concurrency helpers.
 *
 * Both the label indexer and the batch label search need the same thing: run N
 * independent async jobs with a cap on how many are in flight, so the batch costs
 * the slowest job rather than the sum of all of them, without opening an unbounded
 * number of file handles or SQLite queries at once.
 */
/** Run `fn` over `items` with at most `limit` in flight, preserving input order. */
export declare function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]>;
/**
 * How many file reads to keep in flight.
 *
 * Same shape as the extract phase's DEFAULT_FILE_CONCURRENCY (scripts/extract-metadata.ts):
 * host parallelism, floored at 2 so a single-core CI box still overlaps I/O with
 * parsing, capped at 24 because past that the disk is the limit and the extra
 * handles only add queueing.
 */
export declare function defaultFileConcurrency(): number;
//# sourceMappingURL=concurrency.d.ts.map