import { type SettingsStore } from './settingsStore.js';
export interface XppConfig {
    /** Filename without .json, e.g. "contoso-dev___10.0.2428.63" */
    fullName: string;
    /** Environment name before the ___ separator */
    name: string;
    version: string;
    file: string;
    mtimeMs: number;
    modelStoreFolder?: string;
    frameworkDirectory?: string;
}
export declare function xppConfigDir(): string | null;
/** All versioned configs, newest first. Empty when the directory is absent. */
export declare function listXppConfigs(): XppConfig[];
/**
 * Expand a short config name (e.g. "myenv-dev") to the newest full versioned
 * name ("myenv-dev___10.0.2345.153") so a later staleness check is a plain
 * file-exists test, and persist the expansion. No-op for traditional
 * environments, full names, or when nothing matches.
 * Returns the expansion that happened, or null.
 */
export declare function normalizeXppConfigName(store: SettingsStore): {
    from: string;
    to: string;
} | null;
/**
 * True when the pinned config name no longer resolves to a file — i.e. the UDE
 * was upgraded since the instance was configured and its database is stale.
 * Only meaningful after normalizeXppConfigName.
 */
export declare function isXppConfigStale(store: SettingsStore): boolean;
//# sourceMappingURL=xppConfig.d.ts.map