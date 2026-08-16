/**
 * The round-trip cost analysis from #824, as arithmetic over a normalised
 * session (see sessionLog.ts).
 *
 * Four measurements, in the order they answer "where did the money go":
 *   1. fit the host's own billing to (cached, uncached, output) tokens,
 *   2. attribute the total across those three, then split the cached share
 *      into fixed prefix and carry,
 *   3. count round trips — the single-call tool-turns are the waste,
 *   4. per-tool table, which is where a regression in one tool shows up.
 *
 * Step 1 gates steps 2 and 4: a poor fit means the log is not what we think it
 * is, and a confident attribution built on wrong rates is worse than no
 * attribution at all. `CostFit.refusal` carries the reason and every consumer
 * must check `usable` before reading rates.
 */
import type { AgentSession, SessionRequest, SessionToolCall } from './sessionLog.js';
export interface CostRates {
    /** Cost unit per million tokens. */
    cached: number;
    uncached: number;
    output: number;
}
export interface CostFit {
    usable: boolean;
    rates: CostRates | null;
    /** Root-mean-square residual, in the cost unit, per request. */
    rmse: number | null;
    /** rmse as a fraction of the mean billed request cost — the comparable number. */
    relativeRmse: number | null;
    sampleSize: number;
    /** Why attributions are withheld. Null exactly when `usable`. */
    refusal: string | null;
}
export interface CostAttribution {
    cachedInput: number;
    uncachedInput: number;
    output: number;
    total: number;
    /** Tokens re-sent on every request — measured as the first billed request's whole input. */
    prefixTokens: number;
    /** prefixTokens × billed requests × cached rate. */
    fixedPrefix: number;
    /** Σ over tool results of result tokens × later billed requests × cached rate. */
    carry: number;
    /** Cached-input cost per billed request: what a round trip costs before it does any work. */
    floorPerRequest: number;
    /** True when truncated results make `carry` and the per-tool tokens lower bounds. */
    carryIsLowerBound: boolean;
}
export interface RoundTripStats {
    toolCalls: number;
    /** Turns the host counted. */
    hostTurns: number;
    /** Groups of tool calls sharing one model request — the round trips that did work. */
    toolTurns: number;
    singleCallTurns: number;
    singleCallShare: number;
    parallelTurns: number;
    parallelShare: number;
    callsPerToolTurn: number;
    /** Runs of consecutive turns that each reached for the same pluralisable tool. */
    pluralOpportunities: Array<{
        tool: string;
        turns: number;
        calls: number;
        wastedRoundTrips: number;
    }>;
}
export interface ToolStat {
    name: string;
    calls: number;
    serverMs: number;
    resultTokens: number;
    /** Null when the fit was refused — carry cost is priced with the fitted cached rate. */
    carry: number | null;
    truncatedResults: number;
    failures: number;
}
export interface SessionAnalysis {
    format: string;
    sessionId: string | null;
    costUnit: string;
    totals: {
        cost: number;
        requests: number;
        billedRequests: number;
        unbilledRequests: number;
        inputTokens: number;
        cachedTokens: number;
        outputTokens: number;
        wallMs: number;
    };
    models: string[];
    fit: CostFit;
    /** Null exactly when `fit.usable` is false. */
    attribution: CostAttribution | null;
    roundTrips: RoundTripStats;
    tools: ToolStat[];
    truncation: {
        cap: number | null;
        results: number;
    };
    failures: Array<{
        name: string;
        count: number;
    }>;
    warnings: string[];
}
/**
 * Fit cost = cached·rc + uncached·ru + output·ro over the billed requests.
 *
 * The uncached term MUST be `inputTokens − cachedTokens`. Feeding `inputTokens`
 * raw makes the design matrix collinear with the cached column and the solver
 * happily returns −229.99 / 249.99 / 1000.00 at exactly the same residual — a
 * perfect fit with a negative price for reading cache. Hence the explicit
 * subtraction here and the negative-rate refusal below.
 */
export declare function fitCostModel(requests: SessionRequest[]): CostFit;
/**
 * Group tool calls into the round trip that issued them.
 *
 * By timestamp, never by `parentSpanId`: in Copilot's log every tool_call names
 * the same `user_message` as its parent, so the parent chain says nothing about
 * turns. A tool call belongs to the last request that started before it — which
 * is exactly the request that asked for it, and exactly the request whose
 * prompt was billed to get it.
 *
 * Grouping by the host's own `turn_start`/`turn_end` windows instead is
 * possible and gives a slightly different answer — 69 single-call turns rather
 * than 66 on the audited session, which is the figure #824 published. The
 * request grouping is used here because the unit being priced is the billed
 * round trip, not the host's UI turn: calls that land after a `turn_end` but
 * before the next request were still paid for by that request.
 */
export declare function groupToolCallsByRequest(requests: SessionRequest[], toolCalls: SessionToolCall[]): SessionToolCall[][];
export declare function analyzeSession(session: AgentSession): SessionAnalysis;
//# sourceMappingURL=analyze.d.ts.map