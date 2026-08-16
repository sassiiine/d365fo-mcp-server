/**
 * Setting registry — the single source of truth for every configurable value.
 *
 * One entry per setting describes, in one place:
 *   • where it lives in config/d365fo-mcp.json (`path`, dotted)
 *   • which environment variable the runtime actually reads (`env`)
 *   • how to serialise it to that variable (`type`)
 *   • what to ask the user and how to explain it (`label` / `description`)
 *   • whether the setup wizard asks for it up front (`tier`)
 *
 * Everything else — the wizard, the config loader, the doctor and the docs
 * table — is generated from this list, so a new setting only has to be added
 * here. Purely operational variables the user should never have to set
 * (NODE_ENV, WEBSITES_PORT, CI/TERM detection, ENV_FILE, MCP_STDIO_MODE,
 * ALLOW_UNAUTHENTICATED) are deliberately absent: they are runtime/platform
 * inputs, not configuration.
 */
export type SettingType = 'string' | 'path' | 'boolean' | 'int' | 'list' | 'enum';
/**
 * basic = asked during setup · advanced = asked only in the advanced pass ·
 * secret = stored in config/secrets.json · env-only = documented environment
 * variable with no config-file key (see `path` below).
 */
export type SettingTier = 'basic' | 'advanced' | 'secret' | 'env-only';
export type SectionId = 'environment' | 'workspace' | 'naming' | 'index' | 'server' | 'bridge' | 'behavior' | 'azure';
export interface SettingChoice {
    value: string;
    hint: string;
}
export interface Setting {
    /**
     * Dotted path inside the JSON config, e.g. "environment.packagePath".
     *
     * Absent for `env-only` settings: values whose reader is somewhere the
     * wizard-managed JSON cannot honestly describe — the cross-model consent
     * switches, re-read from the .env before every guard decision so a grant
     * applies without a restart (loadEnv.reloadWritePolicy), and the lock
     * heartbeat, read at acquire time in a process the wizard never configures.
     * A JSON key would misrepresent when a change takes effect.
     *
     * "The runtime reads it straight from process.env" is NOT that reason — every
     * setting here does, via toEnvRecord. EXTENSION_PREFIX_SOURCE sat in this
     * group on that basis alone until #893, which cost a multi-instance install a
     * whole second configuration file for one static naming preference.
     *
     * env-only settings are still registered — without an entry the docs
     * generator silently drops them, which is how three cross-model variables
     * disappeared from docs/CONFIGURATION.md the last time it was regenerated.
     */
    path?: string;
    /** Environment variable the server/scripts read at runtime. */
    env: string;
    section: SectionId;
    tier: SettingTier;
    type: SettingType;
    /** Question shown by the wizard. */
    label: string;
    /** Why this exists and what changes when you set it — shown as a hint and in the docs. */
    description: string;
    /** Effective default when the value is absent; documented, never written blindly. */
    default?: string | number | boolean | string[];
    choices?: SettingChoice[];
    placeholder?: string;
    /** Wizard refuses an empty answer. */
    required?: boolean;
}
export interface Section {
    id: SectionId;
    title: string;
    description: string;
}
export declare const SECTIONS: Section[];
export declare const SETTINGS: Setting[];
export declare function settingByPath(path: string): Setting | undefined;
export declare function settingByEnv(env: string): Setting | undefined;
export declare function settingsInSection(section: SectionId, tier?: SettingTier): Setting[];
/** Serialise a config value to the string form the runtime expects in process.env. */
export declare function serializeValue(setting: Setting, value: unknown): string | null;
/** Parse a string (from a .env file or a prompt) into the typed config value. */
export declare function parseValue(setting: Setting, raw: string): unknown;
//# sourceMappingURL=settings.d.ts.map