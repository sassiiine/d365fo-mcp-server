export interface Instance {
    name: string;
    dir: string;
    /** Legacy .env path — may not exist. */
    envFile: string;
    configFile: string;
    port: number | null;
}
export declare function listInstances(): Instance[];
export declare function getInstance(name: string): Instance | undefined;
/**
 * Whether this instance's configuration sits in instances/<name>/config/, the
 * layout a build between the old wizard and #727 wrote. It keeps working —
 * configBaseDir() strips the trailing `config` folder, so ./data/… still
 * resolves to the instance folder — but every doc, script and note describes
 * the top-level form, so a user following them points D365FO_CONFIG at a file
 * that does not exist and the server silently starts on defaults.
 */
export declare function isLegacyInstanceLayout(inst: Instance): boolean;
/**
 * Move an instance out of the config/ layout: d365fo-mcp.json and secrets.json
 * go up one level, and the folder is removed when nothing else is left in it.
 * Returns the files that were moved (empty when there was nothing to do).
 *
 * Deliberately not called from openInstanceStore: a write hidden inside a read
 * would fire from every command, including the read-only ones. The explicit
 * callers are `instance upgrade` (which already rewrites the config) and the
 * fix line `doctor` prints.
 */
export declare function normalizeInstanceLayout(inst: Instance): string[];
/** Next free port: max of existing instance ports + 1, or 3001. */
export declare function suggestPort(instances: Instance[]): number;
/**
 * Create instances/<name>/{d365fo-mcp.json,data,metadata} with the port and the
 * instance-local index paths pre-filled; the remaining settings are asked for
 * by the caller. Throws when the instance already exists.
 */
export declare function createInstance(name: string, port: number): Instance;
//# sourceMappingURL=instances.d.ts.map