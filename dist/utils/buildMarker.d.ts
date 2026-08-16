/**
 * Build marker — the note `build_d365fo_project` leaves for the tools that report a
 * verdict without compiling anything.
 *
 * Why it exists: run_bp_check and verify_d365fo_project both answer confidently and
 * neither one compiles. xppbp does not diagnose the SYS-class compiler errors (an
 * `if (ret) { ret = next foo(); }` in a CoC method is SYS10028, and xppbp is silent),
 * and verify only proves a file is on disk and in the .rnrproj. Benchmark run
 * f2e7b71a skipped the build entirely, was told "✅ BP Check passed — 0 with findings"
 * plus a fully green verification table, and shipped a class that does not compile.
 *
 * Nothing here blocks anything. It records when a model last built cleanly so those
 * tools can say "and nothing has compiled this since you changed it" instead of
 * implying a green light they never checked for.
 */
/** Written next to the metadata databases, one entry per model. */
export declare const BUILD_MARKER_FILENAME = ".last-build.json";
export interface ModelBuildRecord {
    /** ISO timestamp of the build that produced this record. */
    builtAt: string;
    /** Whether it was a full build; an incremental green is not proof the model compiles. */
    fullBuild: boolean;
    /** True only for a build with zero errors. Warnings still count as succeeded. */
    succeeded: boolean;
}
export type BuildMarker = Record<string, ModelBuildRecord>;
/**
 * Record the outcome of a build. Best-effort: a build succeeds even if this write
 * fails, so callers do not need to handle an error here.
 */
export declare function recordBuild(dataDir: string, modelName: string, record: ModelBuildRecord): void;
/** The last recorded build for `modelName`, or undefined if it never built here. */
export declare function readBuildRecord(dataDir: string, modelName: string): ModelBuildRecord | undefined;
/**
 * What a build record says about the state these objects are in.
 *
 * `never` and `stale` are the two that mean the same thing to a caller — nothing
 * has compiled what is on disk right now — and they are why this is a status and
 * not just a sentence. A verdict that wants to stay honest has to branch on it,
 * and matching on the emoji in the message would be a worse way to ask.
 */
export type BuildFreshnessStatus = 'never' | 'stale' | 'incremental' | 'full';
export interface BuildFreshness {
    status: BuildFreshnessStatus;
    /** The one-line caveat, ready to print. */
    message: string;
}
/**
 * Whether this model has been compiled since the objects were last written.
 *
 * `files` is optional because the callers differ: verify_d365fo_project already
 * resolves each object's path and can prove staleness, while run_bp_check only knows
 * names. With no paths the answer is coarser ("nothing has built this model") but it
 * is the case that actually went wrong, so it is worth saying either way.
 *
 * Phrased as a statement of fact rather than an instruction: the caller is reporting
 * its own result, and this is what that result does not cover.
 */
export declare function buildFreshness(dataDir: string, modelName: string, files?: string[]): BuildFreshness;
/** The caveat line alone, for callers that only print it. */
export declare function describeBuildFreshness(dataDir: string, modelName: string, files?: string[]): string;
//# sourceMappingURL=buildMarker.d.ts.map