/**
 * Deterministic form control expander.
 *
 * Walks the curated form-pattern catalog (the SAME data the validator enforces)
 * and emits the required control skeleton directly, instead of cloning a
 * reference form or hand-writing per-pattern XML. Because generation and
 * validation share one source of truth, the output is structurally
 * pattern-correct by construction — every `required`/`oneOrMore` container the
 * pattern mandates is present, in spec order, with the pattern's expected
 * container properties.
 *
 * Scope & safety:
 *   - Covers patterns that have no hand-written `FormPatternTemplates` entry
 *     (which would otherwise silently degrade to SimpleList).
 *   - `requiresSubPattern` containers are emitted WITHOUT a declared sub-pattern
 *     (an FP006 warning, never an error), keeping the output guaranteed
 *     error-free. Sub-pattern enrichment can be layered on later.
 *   - The caller (generateSmartForm) self-tests the result against
 *     validateFormPatternXml and falls back to the proven templates on error.
 *
 * Indentation is intentionally simple: both the pattern validator (xml2js) and
 * the on-write normalizer (normalizeD365Xml) are whitespace-insensitive, so
 * exact AOT tabbing is applied at write time, not here.
 */
import type { FormPatternSpec, NodeSpec } from '../knowledge/formPatterns/index.js';
import type { FieldControlMap } from './fieldControlTypes.js';
export interface ExpandFormOptions {
    formName: string;
    dsName?: string;
    dsTable?: string;
    caption?: string;
    gridFields?: string[];
    fieldTypes?: FieldControlMap;
    linesDsName?: string;
    linesDsTable?: string;
    linesFields?: string[];
    linesFieldTypes?: FieldControlMap;
}
/** A node is concrete (emittable) when it names a single, specific control type. */
export declare function isConcrete(spec: NodeSpec): boolean;
/** Required containers only — optional/zeroOrMore slots are left out of the skeleton. */
export declare function isRequired(spec: NodeSpec): boolean;
/**
 * Whether the expander can faithfully build this pattern. It bails when:
 *   - the pattern has no known versions (e.g. the "Custom" escape-hatch pattern),
 *   - any *required* node (at any depth) names no concrete control type (a `*`
 *     wildcard slot — e.g. HubPart's required "Chart"), which the expander cannot
 *     materialise and which would trip FP003.
 *   - sibling slots share a control type (e.g. two `Group`s distinguished only
 *     by Style). Skipping an optional one shifts the validator's type-based
 *     greedy matcher onto the wrong slot, so the result is unreliable.
 * Callers should fall back to a hand-written template / clone for these.
 */
export declare function canExpandPattern(spec: FormPatternSpec): boolean;
/**
 * Public wrapper around {@link emitNode}: render a single pattern NodeSpec (and
 * its required descendants) as AxForm control XML at the given indent depth.
 * Used by the form-repair path to materialise a missing required control.
 * Returns '' for nodes that cannot be concretely emitted.
 */
export declare function buildControlXml(spec: NodeSpec, opt: ExpandFormOptions, depth: number): string;
/**
 * Expand a form pattern spec into complete AxForm XML, deterministically and
 * straight from the catalog. Used for patterns that have no dedicated
 * hand-written template.
 */
export declare function expandPatternToXml(spec: FormPatternSpec, opt: ExpandFormOptions): string;
//# sourceMappingURL=formControlExpander.d.ts.map