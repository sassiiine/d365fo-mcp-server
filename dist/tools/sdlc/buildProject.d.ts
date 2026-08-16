import { type CompileLabelsResult } from '../write/compileLabels.js';
import type { ProgressReporter } from '../../utils/progressReporter.js';
export interface XppcDiagnostic {
    severity: 'error' | 'warning';
    /** Element kind as reported by xppc, e.g. "Class Method", "Table Field" */
    kind?: string;
    model?: string;
    object?: string;
    member?: string;
    line?: number;
    column?: number;
    message: string;
}
/** Prefix-only test, for deciding which log lines are worth keeping in an excerpt. */
export declare const DIAG_LINE_TEST: RegExp;
/** Errors xppc counted in this log, or null when it printed no tally. */
export declare function xppcReportedErrorCount(logContent: string): number | null;
/** Parse xppc log content into structured diagnostics. */
export declare function parseXppcDiagnostics(logContent: string): XppcDiagnostic[];
/**
 * What to say when the compiler failed and this parser cannot show why.
 *
 * A FAILED headline over a list of warnings reads as though the warnings are
 * the cause, and invites deleting whatever is nearest to clear the red. Name
 * the gap instead. Returns '' when the parsed errors do explain the failure.
 */
export declare function renderUnexplainedFailure(parsed: XppcDiagnostic[], logContent: string): string;
/**
 * Render diagnostics as a numbered, machine-actionable block. Errors come
 * first; duplicate messages are collapsed; the first few distinct errors are
 * enriched with a fix hint from the get_d365fo_error_help knowledge base so
 * the model can correct everything in one round.
 */
export declare function formatStructuredDiagnostics(diagnostics: XppcDiagnostic[], maxItems?: number): string;
interface QueueResult {
    modelName: string;
    status: 'succeeded' | 'failed';
    duration: number;
    logFile: string;
}
interface BuildJobState {
    pid: number;
    modelName: string;
    targetModel: string;
    tool: string;
    startTime: string;
    logFile: string;
    status: 'running' | 'succeeded' | 'failed';
    phase?: 'compiling' | 'finalizing';
    exitCode?: number;
    endTime?: string;
    fullBuild?: boolean;
    buildQueue?: string[];
    queueIndex?: number;
    queueResults?: QueueResult[];
}
/**
 * True when any source file in the model package changed after `since` (epoch
 * ms). Short-circuits on the first hit, so the "something changed" case — the
 * one that must not be missed — is also the fast one.
 *
 * On a blown time budget or an unreadable tree it returns TRUE. Both failure
 * directions are not equal: a needless rebuild costs minutes, while a wrongly
 * reused result reports a compile that never happened.
 */
export declare function hasSourceChangesSince(modelDir: string, since: number, budgetMs?: number): Promise<boolean>;
/**
 * Whether a finished build result still describes what is on disk.
 *
 * A finished state left on disk used to be returned verbatim to the NEXT
 * call, which then read as that call's own result. Observed 2026-07-28 while
 * capturing the L2-coc-inherited-method golden: a wrapper was edited to a
 * deliberately uncompilable signature, and the following build reported
 * "✅ Build succeeded / Errors: 0" with byte-identical phase timings from the
 * previous run. The poisoned file was written at 15:05:46; the build log had
 * last been touched at 15:05:04 — 42 s EARLIER. Nothing had been compiled.
 *
 * That is the worst failure this tool can have: pass@build is the gate the
 * whole eval loop leans on, and a green that describes a tree nobody compiled
 * is indistinguishable from a real one without checking log timestamps by hand.
 */
export declare function finishedResultStillDescribesDisk(state: BuildJobState, targetModel: string, customPackagesPath: string): Promise<boolean>;
/**
 * The label-compilation outcome as it should appear at the top of the build
 * log. A clean run is silent — nothing was wrong, and a note per build would
 * only crowd out the compiler output. A FAILED run is loud and says what it
 * costs, because the symptom it produces (`BPErrorUnknownLabel` on a label
 * that plainly exists, plus the `BPUnusedStrFmtArgument` warnings that cascade
 * from it) otherwise reads as broken source code.
 */
export declare function describeLabelCompilation(modelName: string, result: CompileLabelsResult): string;
export declare const buildProjectTool: (params: any, context: any, onProgress?: ProgressReporter) => Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
export {};
//# sourceMappingURL=buildProject.d.ts.map