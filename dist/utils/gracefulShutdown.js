/**
 * Ordered, bounded release of process-owned resources.
 *
 * The server owns things a bare process death leaves in a bad state: the C#
 * bridge child, which may be part-way through writing AOT XML, and the SQLite
 * handles. Termination is routine rather than exceptional here — an MCP client
 * ends a stdio session by closing the pipe or signalling, and Azure sends
 * SIGTERM before a restart — so stopping needs a defined path.
 *
 * Two rules shape the design:
 *
 *  - Reverse order. Cleanups run last-registered-first, so a resource is torn
 *    down before whatever it was built on top of.
 *  - Shutdown must never be the thing that hangs. Every step is best-effort, a
 *    failing one cannot strand the rest, and the whole sequence is capped: past
 *    the deadline the process exits regardless, because a stop that does not
 *    stop is worse than an unclean one.
 *
 * The exit and log seams exist so this is testable without ending the test
 * runner's own process.
 *
 * Platform note — what actually triggers this on Windows. Measured on the dev VM:
 * a signal sent from another process (`child.kill('SIGTERM'|'SIGINT')`) does NOT
 * run these handlers, because libuv implements it as TerminateProcess; the child
 * dies reporting the signal and no cleanup happens. So on Windows the path that
 * matters is stdin closing — which is how an MCP client ends a stdio session, and
 * which is verified to release the bridge child — plus Ctrl+C in a console, which
 * Node does deliver as SIGINT. The signal handlers are still the right thing to
 * register: they work as written on Linux, where Azure sends SIGTERM before a
 * restart.
 */
/**
 * Conventional exit code for a signal-terminated process (128 + signal number).
 * Supervisors read it to tell an orderly stop from a crash.
 */
const SIGNAL_EXIT_CODES = {
    SIGHUP: 129,
    SIGINT: 130,
    SIGTERM: 143,
};
export function createShutdownCoordinator(options = {}) {
    const deadlineMs = Math.max(1_000, options.deadlineMs ?? 5_000);
    const exit = options.exit ?? ((code) => process.exit(code));
    // Straight to stderr by default, not console.error: index.ts wraps that to
    // suppress anything shaped like "[module] …" without an error marker, and
    // shutdown progress is exactly what an operator needs when a stop goes wrong.
    const log = options.log ?? ((message) => process.stderr.write(`${message}\n`));
    const cleanups = [];
    let shuttingDown = false;
    async function shutdown(reason, exitCode = 0) {
        if (shuttingDown)
            return;
        shuttingDown = true;
        const note = (msg) => log(`[shutdown] ${msg}`);
        note(`${reason} — releasing resources`);
        // unref() so this timer alone cannot keep the process alive once everything
        // has finished cleanly.
        const deadline = setTimeout(() => {
            note(`still busy after ${deadlineMs} ms — exiting anyway`);
            exit(exitCode);
        }, deadlineMs);
        if (typeof deadline.unref === 'function')
            deadline.unref();
        for (const { name, run } of [...cleanups].reverse()) {
            try {
                await run();
            }
            catch (err) {
                note(`${name} failed to close: ${err instanceof Error ? err.message : err}`);
            }
        }
        clearTimeout(deadline);
        note('done');
        exit(exitCode);
    }
    return {
        onShutdown(name, run) {
            cleanups.push({ name, run });
        },
        shutdown,
        registerSignalHandlers({ stdio = false } = {}) {
            for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
                process.on(signal, () => void shutdown(`received ${signal}`, SIGNAL_EXIT_CODES[signal]));
            }
            // A closed stdin means the MCP client is gone. Only meaningful in stdio
            // mode — in HTTP mode stdin may legitimately be closed for the whole
            // process lifetime.
            if (stdio) {
                process.stdin.on('end', () => void shutdown('stdin closed by the MCP client', 0));
            }
        },
        get isShuttingDown() {
            return shuttingDown;
        },
    };
}
//# sourceMappingURL=gracefulShutdown.js.map