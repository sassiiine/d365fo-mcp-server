import type { SettingsStore } from './settingsStore.js';
/**
 * A stdio server entry.
 *
 * D365FO_CONFIG is passed explicitly rather than left to discovery: the IDE
 * spawns node from an arbitrary working directory, and one clone can serve
 * several configurations. Anything else added to this `env` block still wins
 * over the config file, which is how a per-solution override (a different
 * D365FO_MODEL_NAME, say) is expressed.
 */
export declare function stdioServer(store: SettingsStore, extraEnv?: Record<string, string>): Record<string, unknown>;
export declare function mcpJsonNote(servers: Record<string, unknown>, title?: string): void;
export declare function placementNote(): void;
//# sourceMappingURL=mcpJson.d.ts.map