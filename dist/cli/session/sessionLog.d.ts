/** One model call. Token counts are as the host recorded them. */
export interface SessionRequest {
    /** epoch ms the request started — the only ordering we can trust. */
    ts: number;
    model: string;
    /** Host's own label for the call, e.g. 'panel/editAgent'. Free text. */
    purpose: string;
    /** Total prompt tokens, cached ones included. */
    inputTokens: number;
    /** Prompt tokens served from the provider's cache. */
    cachedTokens: number;
    outputTokens: number;
    /**
     * What the host says it was billed, in `costUnit`. `null` when the host
     * records no cost at all; `0` is a real answer (an included model).
     */
    cost: number | null;
}
export interface SessionToolCall {
    ts: number;
    /** Tool name exactly as the host logged it, MCP prefix and all. */
    name: string;
    /** Server-side duration in ms. */
    durationMs: number;
    /** Length of the logged result — see `resultTruncationCap` before trusting it. */
    resultChars: number;
    /** Content-based, deliberately narrow — see copilotChatLog.ts for why. */
    failed: boolean;
}
export interface AgentSession {
    /** Human-readable format id, printed so a surprising parse is visible. */
    format: string;
    sessionId: string | null;
    /** Billing unit of `SessionRequest.cost`, e.g. 'AIU'. */
    costUnit: string;
    requests: SessionRequest[];
    toolCalls: SessionToolCall[];
    /** Turns the host itself counted, which need not equal the tool-turns. */
    turns: number;
    /**
     * Character length at which the host truncated logged tool results, or null
     * when nothing was truncated. Every token figure derived from result sizes
     * is a LOWER BOUND once this is set.
     */
    resultTruncationCap: number | null;
}
/**
 * Read a session log, choosing the reader by content rather than by filename —
 * hosts all call the file something different, and `main.jsonl` is not a name
 * anyone would guess.
 *
 * Fails loudly on an unrecognised log. Guessing here would produce a confident
 * cost number from a file that is not a session at all, which is the one
 * outcome this command exists to prevent.
 */
export declare function readSessionLog(path: string, formatHint?: string): AgentSession;
export declare const KNOWN_FORMATS: string[];
//# sourceMappingURL=sessionLog.d.ts.map