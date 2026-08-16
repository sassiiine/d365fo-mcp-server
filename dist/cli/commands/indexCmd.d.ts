import { Target } from '../target.js';
/** Run extract + build-database for one target. Returns true on success. */
export declare function rebuildIndex(target: Target): Promise<boolean>;
export declare function indexCommand(instanceName: string | undefined, opts: {
    all?: boolean;
    yes?: boolean;
}): Promise<void>;
//# sourceMappingURL=indexCmd.d.ts.map