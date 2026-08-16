/**
 * SysTest runtime-oracle adapter (docs/AGENT_EVAL_LOOP.md §6.3, §5 `systest`).
 *
 * The loop's golden oracle judges metadata *shape*; it cannot judge a method
 * body. The runtime signal comes from running a SysTest class via the
 * `run_systest_class` MCP tool. This module parses that tool's text output into
 * the structured `{ ran, passed, failures }` the corpus record carries, so a
 * code-heavy case can be scored on behaviour, not just compilation.
 *
 * `run_systest_class` emits one of these header forms (src/tools/sysTestRunner.ts):
 *   ✅ Tests passed              → ran, passed
 *   ❌ Tests FAILED             → ran, failed (+ failure lines in the body)
 *   ⚠️ Tests completed ...       → ran, indeterminate (passed=null)
 *   ❌ Tests failed:\n\n<err>    → could NOT run (exec/exception) → ran=false
 *   ❌ Cannot determine model… / Neither SysTestConsole… / Invalid parameter…
 *   ❌ SysTestConsole.exe requires an interactive console session…
 *                                → could NOT run → ran=false
 */
export interface SysTestFailure {
    /** Best-effort test/method identifier; '' when not recoverable from the line. */
    test: string;
    message: string;
}
export interface SysTestResult {
    ran: boolean;
    passed: boolean | null;
    failures: SysTestFailure[];
}
export declare function parseSysTestResult(output: string | null | undefined): SysTestResult;
//# sourceMappingURL=systest.d.ts.map