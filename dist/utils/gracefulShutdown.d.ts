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
export interface ShutdownCoordinatorOptions {
    /** Hard cap for the whole sequence (ms). */
    deadlineMs?: number;
    /** Process exit. Injectable for tests. */
    exit?: (code: number) => void;
    /** Where progress is reported. Injectable for tests. */
    log?: (message: string) => void;
}
export interface ShutdownCoordinator {
    /** Register a resource to release. Later registrations run first. */
    onShutdown(name: string, run: () => void | Promise<void>): void;
    /** Run every cleanup once, then exit. Repeat calls are ignored. */
    shutdown(reason: string, exitCode?: number): Promise<void>;
    /** Wire SIGINT/SIGTERM/SIGHUP, and (in stdio mode) the client closing stdin. */
    registerSignalHandlers(opts?: {
        stdio?: boolean;
    }): void;
    readonly isShuttingDown: boolean;
}
export declare function createShutdownCoordinator(options?: ShutdownCoordinatorOptions): ShutdownCoordinator;
//# sourceMappingURL=gracefulShutdown.d.ts.map