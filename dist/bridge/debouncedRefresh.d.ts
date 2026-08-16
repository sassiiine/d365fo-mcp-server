/**
 * Coalesces multiple rapid refreshProvider() calls into a single call, so that
 * a burst of create/modify operations triggers only one DiskProvider refresh.
 *
 * Writers call refresh() and do NOT await it — a full DiskProvider rebuild
 * serialized into a create's response is seconds the caller pays for a provider
 * generation nothing may ever read. Anything that must resolve an object written
 * this session calls flush() first, which is free unless a rebuild is actually
 * outstanding. The guarantee "a write is visible to the next bridge operation"
 * therefore survives; only who pays for it moves.
 */
import type { BridgeClient } from './bridgeClient.js';
import type { BridgeRefreshResult } from './bridgeClient.js';
/** Epoch ms at which the last provider refresh started; 0 if none yet. */
export declare function getLastRefreshStartedAt(): number;
/** Record that a refresh is starting now. Called by every refresh path. */
export declare function markRefreshStarted(at?: number): void;
/** Forget the recorded refresh time and any in-flight rebuild (test isolation). */
export declare function resetRefreshTracking(): void;
/**
 * Request a bridge refresh. If one is already pending, the settle timer
 * resets (up to MAX_WAIT_MS). All callers receive the same result.
 */
export declare function refresh(bridge: BridgeClient): Promise<BridgeRefreshResult | null>;
/**
 * Wait until the provider is no older than this moment.
 *
 * Free when nothing is outstanding, which is the single-operation case: it must
 * not become the 400 ms settle window a naive `await refresh()` would impose.
 * When a write did schedule a rebuild, the caller that actually needs to resolve
 * the new object pays for it — instead of every writer paying on its way out.
 */
export declare function flush(): Promise<BridgeRefreshResult | null>;
/** Cancel any pending refresh without executing it (test cleanup). */
export declare function cancel(): void;
//# sourceMappingURL=debouncedRefresh.d.ts.map