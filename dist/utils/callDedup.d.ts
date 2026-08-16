/**
 * Duplicate-call dedup cache (agentic-loop mitigation).
 *
 * A model stuck in a loop re-issues the same read call with identical
 * arguments. Read tools are served from a short-TTL cache on repeat — the
 * model gets the identical answer instantly (with a note) instead of
 * re-running DB/bridge queries. Stateful tools are excluded: repeated
 * identical calls are legitimate there (build polling, write retries after
 * fixes, git state checks).
 */
export declare const DEDUP_TTL_MS = 60000;
/** Tools whose repeated identical calls are legitimate — never dedup, never loop-hint. */
export declare const DEDUP_EXCLUDED_TOOLS: Set<string>;
export declare function dedupKey(toolName: string, args: unknown): string;
export declare function getDedupedResult(key: string): any | undefined;
export declare function storeDedupResult(key: string, result: any): void;
/** Test/maintenance helper. */
export declare function clearDedupCache(): void;
export declare function getInFlight(key: string): Promise<any> | undefined;
export declare function registerInFlight(key: string): {
    resolve: (r: any) => void;
    reject: (e: any) => void;
};
export declare function clearInFlight(key: string): void;
export declare function clearAllInFlight(): void;
/** Append a note to the first text item of a result (shallow clone). */
export declare function appendNote(result: any, note: string): any;
//# sourceMappingURL=callDedup.d.ts.map