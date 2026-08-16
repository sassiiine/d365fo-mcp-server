/**
 * generate_object mode parameter specs — the single source of truth for
 * mode-specific parameters (names, types, descriptions).
 *
 * The wire schema only advertises the discriminators (`mode`, `pattern`,
 * `objectType`, `name`, `modelName`) plus a free-form `params` object; inlining
 * all six modes' parameters cost ~7.5 KB on EVERY request while any one call
 * needs exactly one mode (issue #825). The contract is fetched on demand via
 * get_knowledge(kind="op-spec", topic="<mode>") and repeated in the error a
 * call gets when a required parameter is missing.
 *
 * The dispatcher merges `{...args, ...args.params}` so flat calls keep working.
 *
 * tests/tools/generateObjectOpSpecs.test.ts guards mode coverage.
 */
/** Type + description for a single generate_object parameter, keyed by name. */
export declare const GENERATE_OBJECT_PARAM_SPECS: Record<string, {
    type: string;
    description: string;
}>;
export interface GenerateObjectModeSpec {
    /** Params whose absence makes the call a guaranteed error. */
    required: string[];
    /** Params the mode understands beyond the required ones. */
    optional: string[];
    /** Mode-level guidance that used to live in the published schema. */
    note?: string;
}
/**
 * Per-mode parameter specs. `scaffold` splits by objectType because the three
 * scaffolds share almost nothing — `scaffold:form` is the spec a form call needs.
 */
export declare const GENERATE_OBJECT_MODE_SPECS: Record<string, GenerateObjectModeSpec>;
/** Required params for a mode ([] for unknown modes). */
export declare function getGenerateObjectRequiredParams(mode: string): string[];
/**
 * Full parameter spec for one generate_object mode — names, types, descriptions.
 * Used by the op-spec lookup and by the missing-parameter error, so a failed
 * call carries everything needed to retry correctly.
 */
export declare function renderGenerateObjectSpec(mode: string): string;
//# sourceMappingURL=generateObjectOpSpecs.d.ts.map