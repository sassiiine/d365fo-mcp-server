import { Instance } from './instances.js';
import { type SettingsStore } from './settingsStore.js';
export interface Target {
    /** 'root' or the instance name */
    name: string;
    label: string;
    /** Legacy .env, when one exists — still read as a fallback by the server. */
    envFile: string | null;
    /** Structured configuration (config/d365fo-mcp.json or instances/<name>/d365fo-mcp.json). */
    store: SettingsStore;
    port: number | null;
    instance?: Instance;
}
/** Environment for a child process so it loads this target's configuration. */
export declare function targetEnv(target: Target): Record<string, string> | undefined;
export declare function rootTarget(): Target;
export declare function instanceTarget(inst: Instance): Target;
/**
 * Resolve the target: explicit name → that instance ('root' selects the root
 * server); no name and no instances → root; otherwise ask.
 */
export declare function pickTarget(instanceName: string | undefined, message: string): Promise<Target>;
//# sourceMappingURL=target.d.ts.map