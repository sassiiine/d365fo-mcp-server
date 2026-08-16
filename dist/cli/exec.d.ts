export interface RunOptions {
    cwd?: string;
    env?: Record<string, string>;
}
/** Run a constant command line (e.g. 'npm install') through the shell. */
export declare function runShell(command: string, opts?: RunOptions): Promise<number>;
/** Run the current Node binary with the given args (no shell). */
export declare function runNode(args: string[], opts?: RunOptions): Promise<number>;
/** Run a real executable (dotnet, git) with an args array (no shell). */
export declare function runExe(cmd: string, args: string[], opts?: RunOptions): Promise<number>;
/**
 * Whether an executable is on PATH.
 *
 * Used to check a prerequisite before spawning it: `runExe` on a missing
 * binary rejects with a bare `spawn <name> ENOENT`, which tells a user
 * nothing about what to install. Runs the command rather than probing PATH by
 * hand so it agrees with what the spawn will actually find.
 */
export declare function commandExists(cmd: string, versionArg?: string): Promise<boolean>;
//# sourceMappingURL=exec.d.ts.map