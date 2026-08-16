import { type ConfigObject } from '../config/configFile.js';
import { type Setting } from '../config/settings.js';
export interface SettingsStore {
    /** Directory holding d365fo-mcp.json / secrets.json. */
    dir: string;
    /** Project directory relative path settings resolve from (repo root, or the instance folder). */
    baseDir: string;
    configPath: string;
    secretsPath: string;
    config: ConfigObject;
    secrets: ConfigObject;
    /** Legacy .env consulted as a fallback when a value is missing from the JSON. */
    legacyEnvFile: string | null;
}
/**
 * Open the store for a base directory (repo root, or an instance folder).
 * `legacyEnvFile` is the .env that used to hold the same settings, if any.
 */
export declare function openStore(baseDir: string, legacyEnvFile: string | null, fallbackConfigPath?: string): SettingsStore;
/** Store rooted at an instance folder: instances/<name>/d365fo-mcp.json. */
export declare function openInstanceStore(instanceDir: string): SettingsStore;
/**
 * Where a setting's effective value actually comes from — the JSON config,
 * the legacy .env fallback, or nowhere. Mirrors readSetting's own precedence
 * so callers can tell "explicitly configured" apart from "inherited from a
 * .env that may have gone stale" without re-deriving the value themselves.
 */
export declare function settingSource(store: SettingsStore, setting: Setting): 'config' | 'env' | 'none';
/** Effective value of a setting, or undefined when nothing configures it. */
export declare function readSetting(store: SettingsStore, setting: Setting): unknown;
/** Effective value, falling back to the documented default. */
export declare function readSettingOrDefault(store: SettingsStore, setting: Setting): unknown;
/** Value as the wizard should pre-fill it in a text prompt. */
export declare function initialText(store: SettingsStore, setting: Setting): string;
/** Absolute form of a `path`-typed setting, or `fallback` when it is unset. */
export declare function readPath(store: SettingsStore, setting: Setting, fallback: string): string;
export declare function writeSetting(store: SettingsStore, setting: Setting, value: unknown): void;
export declare function saveStore(store: SettingsStore): void;
/**
 * Copy every setting present in a legacy .env into the JSON config, so the
 * first `setup` run after upgrading starts from the values already in use.
 * Returns the settings that were carried over.
 */
export declare function migrateLegacyEnv(store: SettingsStore): Setting[];
/**
 * Settings a legacy .env still defines with a value different from the JSON.
 * The JSON wins at runtime, so these are worth reporting rather than fixing.
 */
export declare function conflictingLegacyValues(store: SettingsStore): {
    setting: Setting;
    envValue: string;
    configValue: string;
}[];
//# sourceMappingURL=settingsStore.d.ts.map