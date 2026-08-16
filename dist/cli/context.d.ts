export declare const repoRoot: string;
/**
 * True when the CLI runs from a git checkout — sources, devDependencies (tsx)
 * and `git pull` are all available, so setup/update/index run the TypeScript
 * directly.
 */
export declare const isGitCheckout: boolean;
/**
 * How this copy was installed, which decides how the same commands do their
 * work:
 *
 *   git — a checkout: index scripts run from scripts/*.ts through tsx, and
 *         `update` is git pull + npm install + npm run build.
 *   npm — installed from the registry: there are no sources and no tsx, so the
 *         index scripts run as the bundles under dist/scripts/, and `update`
 *         is `npm install -g d365fo-mcp@latest`.
 *
 * A copy that is neither (an npx cache of a release published before the
 * bundles existed) reports 'npm' but fails `isFullInstall` below, so the user
 * is pointed at the installer instead of failing halfway through a rebuild.
 */
export type InstallMode = 'git' | 'npm';
export declare const installMode: InstallMode;
/** Bootstrap one-liner printed when a command needs a full installation. */
export declare const installOneLiner = "irm https://raw.githubusercontent.com/dynamics365ninja/d365fo-mcp-server/main/install.ps1 | iex";
export declare const isWindows: boolean;
/**
 * The data directory named by a pointer file, or null.
 *
 * Every failure collapses to null on purpose: the file is absent before the
 * first setup, and a truncated or hand-edited one is no more usable than a
 * missing one. Throwing here would break `connect`, which needs neither.
 */
export declare function readInstallPointer(file: string): string | null;
/** Record `dir` as the data directory, creating both it and the pointer's folder. */
export declare function writeInstallPointer(file: string, dir: string): void;
/** Where this installation keeps its configuration, index and instances. */
export declare function dataRoot(): string;
/**
 * Point this installation at `dir` and remember it for future runs.
 *
 * Only meaningful for an npm install; a checkout is its own data directory and
 * calling this on one would split it in two.
 */
export declare function setDataRoot(dir: string): void;
/**
 * Paths every command works from.
 *
 * Getters rather than plain strings: `setDataRoot` runs in the middle of the
 * setup wizard, and the entries below it must reflect the directory the user
 * just chose, not the one that was current when this module was imported.
 */
export declare const paths: {
    /** Legacy configuration file — still read as a fallback, no longer written. */
    readonly rootEnv: string;
    readonly rootConfig: string;
    readonly rootSecrets: string;
    readonly instancesDir: string;
    readonly defaultDb: string;
    readonly defaultLabelsDb: string;
    /** Where setup writes the ready-to-copy .mcp.json file. */
    readonly mcpSuggestion: string;
    /**
     * Where `dotnet build` puts the bridge.
     *
     * A checkout keeps MSBuild's own default inside the project, exactly as
     * before. An npm install cannot: the project lives in the package, and
     * `npm install -g` replaces the package — so the build output would be
     * deleted by the very next update, taking the server's only write path with
     * it. It goes to the data directory instead, which updates never touch.
     *
     * Prebuilding the binary and shipping it in the package is not an option
     * either: every D365FO platform build stamps assembly version 7.0.0.0 and
     * differs only in FileVersion, so a bridge built elsewhere loads the local
     * metamodel without complaint and then fails at JIT time (issue #703, and
     * the version check in Program.cs). It has to be built per environment.
     */
    readonly bridgeOutDir: string | null;
    distEntry: string;
    bridgeDir: string;
    readonly bridgeExe: string;
    extractScript: string;
    buildDbScript: string;
    /** esbuild bundles of the two scripts above — what an npm install ships instead of the sources. */
    extractScriptDist: string;
    buildDbScriptDist: string;
};
/**
 * The exact command that builds the bridge for this installation, for every
 * message that tells a user to run it by hand. An npm install needs the `-o`
 * that puts the output outside the package; printing the bare command would
 * put the binary somewhere the next update deletes.
 */
/**
 * What to say when the bridge cannot be built because the .NET SDK is absent.
 *
 * Deliberately does not mention the .NET Framework 4.8 Developer Pack, which
 * earlier messages here blamed: the project references
 * Microsoft.NETFramework.ReferenceAssemblies.net48, which supplies those
 * reference assemblies from NuGet exactly so the targeting pack need not be
 * installed. Sending people to install a 100 MB pack they do not need, while
 * the actual missing prerequisite goes unnamed, is worse than saying nothing.
 */
export declare const DOTNET_MISSING: string;
export declare function bridgeBuildCommand(): string;
/**
 * True when this copy can rebuild an index — the one capability that separates
 * a full installation from a bare `npx d365fo-mcp connect` client.
 */
export declare const isFullInstall: boolean;
//# sourceMappingURL=context.d.ts.map