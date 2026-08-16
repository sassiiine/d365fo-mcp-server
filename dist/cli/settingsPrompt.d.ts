import type { Setting, SectionId } from '../config/settings.js';
import { type SettingsStore } from './settingsStore.js';
/**
 * Ask for one setting and persist the answer.
 * Returns the value that ended up in the store (or undefined when skipped).
 */
export declare function askSetting(store: SettingsStore, setting: Setting, opts?: {
    required?: boolean;
    initial?: string;
}): Promise<unknown>;
/** Ask a whole list of settings in order. */
export declare function askSettings(store: SettingsStore, settings: Setting[]): Promise<void>;
/**
 * Optional deep-dive: pick sections, then walk their advanced settings.
 * Everything here has a working default, so skipping is always safe.
 */
export declare function askAdvanced(store: SettingsStore, sections: SectionId[]): Promise<void>;
/** Ask for the secrets of the given sections, skipping any already set. */
export declare function askSecrets(store: SettingsStore, sections: SectionId[]): Promise<void>;
//# sourceMappingURL=settingsPrompt.d.ts.map