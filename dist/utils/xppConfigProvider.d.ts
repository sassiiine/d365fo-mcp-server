/**
 * XPP Config Provider
 * Reads Power Platform Tools XPP configuration files to discover
 * custom and Microsoft package paths for UDE development.
 */
export interface XppEnvironmentConfig {
    configName: string;
    version: string;
    customPackagesPath: string;
    microsoftPackagesPath: string;
    referencePackagesPaths: string[];
    xrefDbName?: string;
    xrefDbServer?: string;
    description?: string;
    fullFilename: string;
}
export declare class XppConfigProvider {
    private configDir;
    private cache;
    constructor(configDir?: string);
    /**
     * Parse a config filename into name + version.
     * Pattern: {name}___{version}.json
     */
    parseConfigFilename(filename: string): {
        configName: string;
        version: string;
    } | null;
    /**
     * List all available XPP configs, sorted by modification time (newest first).
     */
    listConfigs(): Promise<XppEnvironmentConfig[]>;
    /**
     * Get the active XPP config.
     * If configName is provided, selects that specific config.
     * Otherwise auto-selects the newest.
     */
    getActiveConfig(configName?: string): Promise<XppEnvironmentConfig | null>;
    /**
     * Check if XPP configs exist (indicates UDE environment).
     */
    hasConfigs(): Promise<boolean>;
    /**
     * Invalidate cached config list.
     */
    clearCache(): void;
}
//# sourceMappingURL=xppConfigProvider.d.ts.map