type Severity = 'ok' | 'warn' | 'fail' | 'info';
interface CheckResult {
    severity: Severity;
    message: string;
    fix?: string;
}
/** Classic AOSService VM, or Unified Developer Experience. */
export type EnvKind = 'traditional' | 'ude';
/**
 * What a path setting IS, so that "this folder is missing" can name the right
 * cause and the right cure for it.
 *
 * Without this the three settings shared one message, and it fitted only one of
 * them: `packagePath` on UDE. It told a traditional VM that its packages root
 * is "normally auto-detected from the active XPP config" (it is not — the drive
 * scan finds it), and it offered `<drive>:\AosService\PackagesLocalDirectory`,
 * a traditional-VM artifact, as the value to give the UDE ModelStoreFolder and
 * FrameworkDirectory.
 *
 * `autoSource` is the load-bearing one: a stale pin is only a *stale pin* where
 * something would otherwise resolve the value live. Where nothing would, the
 * pin is the configuration, and telling the user to delete it is telling them
 * to break their install — `customPackagesPath` on a traditional VM is exactly
 * that case, the documented fix for junction layouts (docs/MCP_CONFIG.md).
 */
interface PathFacts {
    humanName: string;
    /** How the value resolves when nothing pins it, or null when nothing does. */
    autoSource(kind: EnvKind): string | null;
    /** Values doctor can actually propose — empty when it has no way to know one. */
    candidates(kind: EnvKind): string[];
    /** What the setting ought to point at, in words. */
    target(kind: EnvKind): string;
    /** Extra context line when there is no candidate to name, or null. */
    note(kind: EnvKind): string | null;
}
export declare const PATH_FACTS: Record<string, PathFacts>;
/**
 * "Path setting points at a folder that isn't there" — with the cause named.
 *
 * A value pinned by the legacy .env instead of the JSON config is the likely bug
 * whenever something else would have resolved it live: the .env copy goes stale
 * the moment a platform update moves the folder, and it keeps outranking the
 * now-correct detection at every startup (see configManager's envContext, which
 * reads these env vars before consulting the XPP config). The server then dies
 * with "C# bridge unavailable (ude)" and nothing points at the .env.
 *
 * Pure — every input is passed in — so the messages can be tested without a
 * Windows box, an XPP config or a real .env.
 */
export declare function missingPathFix(setting: import('../../config/settings.js').Setting, facts: PathFacts, label: string, configured: string, kind: EnvKind, pinnedByEnv: boolean): Omit<CheckResult, 'severity'>;
/**
 * The configured prefix against the one the model's own objects use.
 *
 * These two disagreeing is normal — a single configured prefix cannot be right
 * for every model — but the server resolves the model's own naming ABOVE the
 * configuration, so a user reading only their config has the wrong answer. State
 * both, and how to pin the configured one.
 *
 * `pinned` is naming.prefixSource=config. This check used to call the inference
 * directly and so never saw it — modelPrefixInference reads it in
 * getInferredModelPrefix, one level above inferPrefixFromObjectNames — which
 * meant a user who had already pinned the prefix was still told their model's
 * naming wins (it does not) and offered the fix they had already applied (#893).
 */
export declare function checkPrefixResolution(configuredPrefix: string, modelName: string | null, modelObjectNames: string[], label: string, pinned?: boolean): CheckResult[];
export declare function doctorCommand(): Promise<void>;
export {};
//# sourceMappingURL=doctor.d.ts.map