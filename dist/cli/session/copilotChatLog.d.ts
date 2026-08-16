/**
 * Reader for GitHub Copilot Chat's `main.jsonl` debug log.
 *
 * One JSON object per line:
 *   {v?, ts, dur, sid, type, name, spanId, parentSpanId?, status, attrs}
 *
 * Four properties of this format are not obvious and each one silently
 * corrupts the analysis if assumed away — they are handled here so the
 * arithmetic in analyze.ts can stay honest:
 *
 *  1. `parentSpanId` does NOT identify a turn. Every one of the audited
 *     session's 118 tool_call spans names the same parent — the single
 *     `user_message` span — so the parent chain would put them all in one
 *     turn. The `turn_start`/`turn_end` spans do carry incrementing turnIds,
 *     but they have no parentSpanId and no tool_call references their spanIds,
 *     so nothing links a call to a turn either. Turn membership is recoverable
 *     only by timestamp (see groupToolCallsByRequest in analyze.ts).
 *  2. `status` is `"ok"` on every span, including calls that plainly failed.
 *     Failure detection has to read the result text.
 *  3. `tool_call.result` and `agent_response.response` are truncated by the
 *     host, so result sizes are lower bounds. The cap is detected rather than
 *     hard-coded, since it is the host's constant and not ours.
 *  4. `toolsFile` is a blob (`{content: "…"}`), not a tool array, and the
 *     catalogue it names was not necessarily all sent — so the prompt prefix
 *     cannot be split into system-prompt vs tool-schema tokens from this log.
 *     analyze.ts measures the prefix as one total instead.
 */
import type { AgentSession } from './sessionLog.js';
export declare function sniffCopilotChatLog(lines: string[]): boolean;
export declare function readCopilotChatLog(lines: string[]): AgentSession;
//# sourceMappingURL=copilotChatLog.d.ts.map