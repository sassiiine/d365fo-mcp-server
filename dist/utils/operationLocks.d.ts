/**
 * Lightweight in-process async locks for serializing heavyweight local
 * operations like builds, BP checks, DB syncs, and SysTest runs.
 *
 * Scope is primarily the local Windows VM companion. We combine:
 * - in-process queueing for concurrent requests hitting the same Node process
 * - filesystem-backed lock directories in os.tmpdir() for cross-process safety
 *
 * This covers the practical case of multiple local MCP companion processes on
 * the same machine. It does NOT provide cross-machine / cross-instance locking;
 * that would require a shared coordinator such as Redis or blob leases.
 */
export declare function withOperationLock<T>(lockKey: string, fn: () => Promise<T>): Promise<T>;
export declare function getOperationLockCount(): number;
/**
 * Returns true if a lock for the given key is currently held (in-process or
 * filesystem-backed by a living process). Dead-process and time-stale locks
 * are treated as not-held so callers don't block after a crash/restart.
 */
export declare function isOperationLockHeld(lockKey: string): Promise<boolean>;
/**
 * Forcibly removes the filesystem lock directory for the given key, allowing
 * a new operation to proceed even if a previous one is stuck.
 */
export declare function forceReleaseLock(lockKey: string): Promise<void>;
//# sourceMappingURL=operationLocks.d.ts.map