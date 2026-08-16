/**
 * Configuration loader: structured JSON config first, legacy .env as fallback.
 *
 * `npm run setup` writes config/d365fo-mcp.json (+ config/secrets.json); this
 * module projects it onto process.env so every consumer keeps reading plain
 * environment variables. Precedence, highest first:
 *
 *   1. the real environment — shell, .mcp.json env{} block, Azure App Settings
 *   2. a .env named explicitly via ENV_FILE (an instance or eval profile the
 *      caller picked on purpose)
 *   3. config/d365fo-mcp.json + config/secrets.json
 *   4. the ambient repo-root .env (pre-wizard installations keep working)
 *   5. the built-in defaults for path settings, resolved against the
 *      installation directory (see defaultPathEnv)
 *
 * Multiple instances run from one source folder by pointing each at its own
 * config or .env file:
 *
 *   D365FO_CONFIG=instances/alpha/d365fo-mcp.json node dist/index.js
 *   ENV_FILE=.env.alpha  npm run build-database
 *
 * Relative paths in DB_PATH, LABELS_DB_PATH, and METADATA_PATH are resolved
 * relative to the config (or .env) file's directory, so instance files can use
 * portable paths like ./data/xpp-metadata.db that survive folder renames.
 */
/**
 * Re-read ONLY the cross-model write policy from the .env loadEnv() used.
 *
 * The guard consults this before every decision, so a user who edits .env to
 * authorise a write sees it take effect on the next attempt instead of having to
 * restart the server and lose the session. That matters because this is the one
 * consent the agent must not be able to grant itself: it has no tool that writes
 * .env, so the file stays the user's, while "restart first" was pushing everyone
 * towards granting it some easier — and self-servable — way.
 *
 * Nothing else is re-read. This is a policy refresh, not a configuration reload;
 * re-projecting paths or credentials under a running index is a different and
 * much riskier thing.
 */
export declare function reloadWritePolicy(): void;
/**
 * Load environment variables from a .env file.
 *
 * @param callerImportMetaUrl - pass `import.meta.url` from the calling module
 *   so the default .env path resolves relative to the repo root regardless of
 *   the process working directory.
 */
export declare function loadEnv(callerImportMetaUrl: string): void;
//# sourceMappingURL=loadEnv.d.ts.map