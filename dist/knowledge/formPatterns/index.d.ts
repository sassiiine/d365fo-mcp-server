/**
 * D365FO Form Pattern Catalog — registry and lookups.
 *
 * Curated from Microsoft Learn pattern guideline docs and the reference forms
 * in PackagesLocalDirectory; cross-checked against mined pattern usage from
 * the symbol index (form_patterns table) once it is populated.
 */
import type { FormPatternCatalog, FormPatternSpec, SubPatternSpec } from './types.js';
export * from './types.js';
export declare const FORM_PATTERN_CATALOG: FormPatternCatalog;
/**
 * Resolve a top-level form pattern by id, xmlName, or free-text alias.
 * Exact (case-insensitive) matches win; alias matching is a fallback.
 */
export declare function resolvePattern(name: string | undefined | null): FormPatternSpec | undefined;
/**
 * Strict resolution by id/xmlName only (case-insensitive) — used by the
 * validator, where alias fuzziness would mask typos in <Pattern> values.
 */
export declare function resolvePatternExact(name: string | undefined | null): FormPatternSpec | undefined;
/** Resolve a sub-pattern by id or xmlName (case-insensitive, exact only). */
export declare function resolveSubPattern(name: string | undefined | null): SubPatternSpec | undefined;
/**
 * Sub-patterns applicable to a container control type, optionally restricted
 * to those valid under a given top-level pattern.
 */
export declare function subPatternsFor(controlType: string, parentPatternId?: string): SubPatternSpec[];
/** All known top-level pattern xmlNames (for tool descriptions/enums) */
export declare function knownPatternNames(): string[];
//# sourceMappingURL=index.d.ts.map