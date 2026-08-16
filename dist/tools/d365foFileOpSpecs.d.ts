/**
 * d365fo_file modify-operation parameter specs — the single source of truth
 * for op-specific parameters (names, types, descriptions).
 *
 * These texts used to live flat in the published d365fo_file inputSchema
 * (~17 K chars of the tools/list payload). They now surface on demand through
 * error-driven guidance: when a modify call misses a required parameter, the
 * error returns the COMPLETE spec for that operation via renderOpSpec().
 * The wire schema only advertises a free-form `params` object
 * (see src/server/toolSchemas/d365foFile.ts); the dispatcher merges
 * `{...args, ...args.params}` so flat calls keep working.
 *
 * tests/utils/toolInventory.test.ts guards that every advertised modify param
 * has an entry here; tests/tools/d365foFileOpSpecs.test.ts guards op coverage.
 */
/** Type + description for a single op parameter, keyed by parameter name. */
export declare const D365FO_FILE_PARAM_SPECS: Record<string, {
    type: string;
    description: string;
}>;
export interface D365FileOpSpec {
    /** Params whose absence makes the operation a guaranteed no-op (error). */
    required: string[];
    /** Params the operation understands beyond the required ones. */
    optional: string[];
    /** Op-level guidance that used to live in the published schema. */
    note?: string;
}
/**
 * A required param may be satisfied by an alias instead
 * (e.g. add-method accepts methodCode in place of sourceCode).
 */
export declare const OP_PARAM_ALIASES: Record<string, string[]>;
/** Per-operation parameter specs for ALL d365fo_file [modify] operations. */
export declare const D365FO_FILE_OP_SPECS: Record<string, D365FileOpSpec>;
/** Required params for an operation ([] for unknown ops — matches old paramHints). */
export declare function getRequiredParams(operation: string): string[];
/**
 * Full parameter spec for one operation — names, types, descriptions — used in
 * error messages so a failed call carries everything needed to retry correctly.
 */
export declare function renderOpSpec(operation: string): string;
//# sourceMappingURL=d365foFileOpSpecs.d.ts.map