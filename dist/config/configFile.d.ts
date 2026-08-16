export type ConfigObject = Record<string, any>;
export interface ResolvedConfigFiles {
    /** Directory holding the config file itself. */
    dir: string;
    /** Project directory — what relative paths resolve from (see configBaseDir). */
    baseDir: string;
    configPath: string;
    secretsPath: string;
    config: ConfigObject | null;
    secrets: ConfigObject | null;
}
export declare function getAtPath(obj: ConfigObject | null | undefined, path: string | undefined): unknown;
export declare function setAtPath(obj: ConfigObject, path: string | undefined, value: unknown): void;
/** Candidate config paths for a given base directory (the .env directory). */
export declare function configCandidates(baseDir: string): string[];
/**
 * Locate and read the config + secrets pair.
 * `baseDir` is the directory of the active .env file (repo root, or an instance folder).
 *
 * `allowEnvOverride` is what the running server wants (D365FO_CONFIG points it
 * at one specific instance); the CLI passes false, since it manages several
 * targets in one process and must not collapse them all onto that one file.
 *
 * `fallbackConfigPath` is where a not-yet-created config should be written when
 * no candidate exists — and, like the candidates themselves, only when
 * D365FO_CONFIG did not already name the file outright. It defaults to the repo
 * layout (<baseDir>/config/…); an instance passes its top-level
 * <baseDir>/d365fo-mcp.json so a freshly created instance lands in the instance
 * layout listInstances() discovers, not under config/ (where it would be
 * invisible to list/rebuild/run).
 */
export declare function resolveConfigFiles(baseDir: string, opts?: {
    allowEnvOverride?: boolean;
    fallbackConfigPath?: string;
}): ResolvedConfigFiles;
/**
 * Directory a relative path setting (./data/xpp-metadata.db) resolves from:
 * the folder that owns the deployment, not the folder that happens to hold the
 * JSON. For the repo layout config/d365fo-mcp.json that is the repo root; for
 * instances/<name>/d365fo-mcp.json it is the instance folder. Keeping paths
 * relative is what lets an instance folder be renamed or moved.
 */
export declare function configBaseDir(configPath: string): string;
/**
 * Flatten config + secrets into the environment variables the runtime reads.
 * Relative `path`-typed values are resolved against `baseDir` so a config file
 * can use portable values like ./data/xpp-metadata.db.
 */
export declare function toEnvRecord(files: Pick<ResolvedConfigFiles, 'baseDir' | 'config' | 'secrets'>): Record<string, string>;
/**
 * The path settings the wizard never writes, resolved against `baseDir`.
 *
 * DB_PATH, LABELS_DB_PATH and METADATA_PATH are advanced settings with
 * relative defaults, so a normal setup leaves them out of the config file
 * entirely and every consumer falls back to its own `'./data/…'` literal —
 * which resolves from process.cwd(). For a git checkout that is the repo, and
 * the answer happens to be right. For an npm install it is the *package*
 * directory: `d365fo-mcp index` spawns the build scripts with cwd = repoRoot,
 * so a 2 GB index landed next to the installed package, on whatever drive npm
 * lives on, instead of in the installation directory the user chose in setup
 * (issue: build ran out of space on C: and SQLite aborted the transaction).
 *
 * Emitting the defaults here pins them to the installation directory instead.
 * A checkout is its own data directory, so its paths do not move.
 */
export declare function defaultPathEnv(baseDir: string): Record<string, string>;
/** Write the config file, creating its directory. Keys are emitted in registry order. */
export declare function writeConfigFile(configPath: string, config: ConfigObject): void;
/** Write secrets.json with owner-only permissions where the platform supports them. */
export declare function writeSecretsFile(secretsPath: string, secrets: ConfigObject): void;
//# sourceMappingURL=configFile.d.ts.map