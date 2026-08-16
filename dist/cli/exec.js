/**
 * Subprocess helpers for the management CLI.
 *
 * Two flavours, chosen to avoid Windows quoting pitfalls:
 *  - runShell: constant command strings (npm install, git pull, …) through the
 *    platform shell — npm/npx are .cmd shims on Windows and cannot be spawned
 *    directly (EINVAL since the Node 18 shell hardening).
 *  - runNode / runExe: real executables (node itself, dotnet.exe) with an args
 *    array and no shell, so paths with spaces need no quoting.
 *
 * All flavours stream output to the terminal (stdio: inherit) — extraction and
 * database builds run for minutes and their progress must stay visible.
 */
import { spawn } from 'node:child_process';
import { repoRoot } from './context.js';
function spawnAndWait(cmd, args, opts, shell) {
    return new Promise((resolvePromise, reject) => {
        const child = spawn(cmd, args, {
            cwd: opts.cwd ?? repoRoot,
            env: { ...process.env, ...opts.env },
            stdio: 'inherit',
            shell,
        });
        child.on('error', reject);
        child.on('close', code => resolvePromise(code ?? 1));
    });
}
/** Run a constant command line (e.g. 'npm install') through the shell. */
export function runShell(command, opts = {}) {
    return spawnAndWait(command, [], opts, true);
}
/** Run the current Node binary with the given args (no shell). */
export function runNode(args, opts = {}) {
    return spawnAndWait(process.execPath, args, opts, false);
}
/** Run a real executable (dotnet, git) with an args array (no shell). */
export function runExe(cmd, args, opts = {}) {
    return spawnAndWait(cmd, args, opts, false);
}
/**
 * Whether an executable is on PATH.
 *
 * Used to check a prerequisite before spawning it: `runExe` on a missing
 * binary rejects with a bare `spawn <name> ENOENT`, which tells a user
 * nothing about what to install. Runs the command rather than probing PATH by
 * hand so it agrees with what the spawn will actually find.
 */
export function commandExists(cmd, versionArg = '--version') {
    return new Promise(resolvePromise => {
        const child = spawn(cmd, [versionArg], { stdio: 'ignore', shell: false });
        child.on('error', () => resolvePromise(false));
        // A non-zero exit still proves the binary is there and runnable; only
        // failure to spawn at all means it is missing.
        child.on('close', () => resolvePromise(true));
    });
}
//# sourceMappingURL=exec.js.map