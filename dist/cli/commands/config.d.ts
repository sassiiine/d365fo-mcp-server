import { type SettingsStore } from '../settingsStore.js';
/** Pin an XPP config (UDE) — the `npm run select-config` flow. */
export declare function selectXppConfig(store: SettingsStore): Promise<boolean>;
export declare function configCommand(sectionArg: string | undefined, opts: {
    instance?: string;
    xppConfig?: boolean;
}): Promise<void>;
//# sourceMappingURL=config.d.ts.map