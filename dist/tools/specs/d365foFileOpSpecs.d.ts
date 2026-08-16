/**
 * d365fo_file modify-operation parameter specs — the single source of truth
 * for op-specific parameters (names, types, descriptions).
 *
 * The wire schema only advertises a free-form `params` object (see
 * src/server/toolSchemas/d365foFile.ts); when a modify call misses a required
 * parameter, the error returns the COMPLETE spec for that operation via
 * renderOpSpec(). The dispatcher merges `{...args, ...args.params}` so flat
 * calls keep working.
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
    /**
     * Optional params of which AT LEAST ONE must be supplied for the operation to
     * mutate anything. Without one of them the op writes nothing, so reporting
     * success would be a lie (corpus finding #6: `modify-field {fieldName,
     * mandatory:true}` returned "✅ Field 'Description' modified" while the wrong
     * key meant nothing was written).
     */
    mutationOneOf?: string[];
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
/**
 * Per-objectType `properties` contract for d365fo_file [create], keyed by the
 * objectType enum value. Moved out of the published inputSchema (issue #825):
 * inlining all 19 contracts cost ~2.4 KB on EVERY request while any one call
 * needs exactly one of them. Fetched on demand through the op-spec lookup —
 * see renderCreatePropertySpec / src/tools/opSpecs.ts.
 *
 * Text is the contract verbatim as it was advertised; objectTypes absent here
 * take no `properties` beyond objectName/sourceCode.
 */
export declare const D365FO_FILE_CREATE_PROPERTY_SPECS: Record<string, string>;
/**
 * Full `properties` contract for one [create] objectType — the create-side twin
 * of renderOpSpec(), used by the op-spec lookup and by create-path errors.
 */
export declare function renderCreatePropertySpec(objectType: string): string;
/**
 * Params every modify call accepts regardless of operation (routing, file
 * resolution, project/backup handling). Anything outside this set and outside
 * the operation's own spec is not consumed by the operation.
 */
export declare const D365FO_FILE_CORE_PARAMS: ReadonlySet<string>;
/**
 * Params an operation ADVERTISES but the write path does not actually serialise.
 * They must never be accepted in silence — the caller has to learn that the
 * value did not reach the XML (corpus cluster #35).
 *
 * Keep this list empty-by-default: an entry here is a confession, not a design.
 * An entry is either a pending VM-side (C#) task or — as with the one below — a
 * parameter the metamodel cannot express at all, in which case the note says so
 * instead of promising a fix that will never come.
 */
export declare const OP_UNHONOURED_PARAMS: Record<string, Record<string, string>>;
/** One parameter the caller supplied that the operation will not consume. */
export interface IgnoredParam {
    name: string;
    /**
     * unknown      — not a parameter of ANY operation (usually a misspelling)
     * other-op     — a real parameter, but not one this operation reads
     * not-honoured — accepted by this operation, but never written (see OP_UNHONOURED_PARAMS)
     */
    reason: 'unknown' | 'other-op' | 'not-honoured';
    /** Closest parameter of THIS operation, when the name looks like a near-miss. */
    suggestion?: string;
    /** Why the value is dropped (for 'not-honoured'). */
    detail?: string;
}
/**
 * Parameters the caller supplied that the operation will NOT consume.
 *
 * The wire schema advertises a free-form `params` object and the Zod schema
 * strips unknown keys, so a misspelled or misplaced parameter used to vanish
 * without a trace and the op still answered "✅". Everything this returns must
 * be surfaced to the caller.
 */
export declare function findIgnoredParams(operation: string, providedKeys: readonly string[]): IgnoredParam[];
/** Human-readable warning block for ignored params (empty string when none). */
export declare function renderIgnoredParamsWarning(operation: string, ignored: readonly IgnoredParam[]): string;
/**
 * Reports that an operation was called with none of the params that would make
 * it mutate anything (see D365FileOpSpec.mutationOneOf). Returns the list of
 * candidate params, or [] when the call is fine.
 */
export declare function findMissingMutationParams(operation: string, providedKeys: readonly string[]): string[];
/** Required params for an operation ([] for unknown ops — matches old paramHints). */
export declare function getRequiredParams(operation: string): string[];
/**
 * Full parameter spec for one operation — names, types, descriptions — used in
 * error messages so a failed call carries everything needed to retry correctly.
 */
export declare function renderOpSpec(operation: string): string;
//# sourceMappingURL=d365foFileOpSpecs.d.ts.map