/**
 * What to do about the C# bridge after the code has been refreshed.
 *
 * Both inputs are needed, and *when* they are sampled is the whole point.
 * `hadBridge` is taken before the update: judged on the after-state alone, a
 * bridge the update destroyed is indistinguishable from one that was never
 * built, and the difference is whether the server just lost its write path.
 *
 *   none     — there was no bridge, so this install does not use writes
 *   optional — the bridge survived; rebuilding is a post-upgrade nicety
 *   required — the update removed a bridge that was there, so the write path
 *              is gone until it is rebuilt
 */
export type BridgeAction = 'none' | 'optional' | 'required';
export declare function bridgeAction(hadBridge: boolean, existsNow: boolean): BridgeAction;
export declare function updateCommand(opts: {
    yes?: boolean;
}): Promise<void>;
//# sourceMappingURL=update.d.ts.map