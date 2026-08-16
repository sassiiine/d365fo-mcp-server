/**
 * Coverage taxonomy — the definition of "100%".
 *
 * Three sources:
 *  1. AOT element types the metadata parser knows about — the mechanically
 *     complete list of everything developable (`source: 'aot'`). The
 *     `aotTypes` of these leaves are the internal type names used by the
 *     symbol index and by d365fo_file/generate_object, so the T flag can be
 *     derived rather than asserted.
 *  2. Cross-cutting X++ development topics that are not AOT elements
 *     (transactions, CoC rules, performance, …) — `source: 'topic'`.
 *  3. Real-world frequency `weight` (0–5): how often a leaf shows up in
 *     customization work. Weights order the closure queue; they are not
 *     used to fudge the percentage.
 *
 * Two published tiers:
 *  - **core**  — anything done at least once per project. A hard commitment;
 *                core coverage is the number we defend publicly.
 *  - **total** — includes exotics (license codes, aggregate measurements).
 *                A visible asymptote, so the metric neither corrupts
 *                (by excluding what is merely hard) nor demotivates.
 *
 * A leaf is covered when K ∧ E ∧ T:
 *   K — a KNOWLEDGE_BASE entry teaches it        (matched via knowledgeIds)
 *   E — a green eval case exercises it           (matched via caseIds/caseTags)
 *   T — the tool path can create/validate it     (matched via aotTypes)
 * The matchers below are *declared here*; the flags themselves are computed
 * from the live sources in coverage.ts, so a deleted case or knowledge entry
 * drops the number instead of going unnoticed.
 */
export type CoverageTier = 'core' | 'total';
export type CoverageSource = 'aot' | 'topic';
export interface CoverageLeaf {
    /** Stable id, kebab-case. Appears in COVERAGE.md and coverage.json. */
    id: string;
    /** Human-readable leaf name. */
    label: string;
    /** Grouping for the per-domain table. */
    domain: string;
    source: CoverageSource;
    tier: CoverageTier;
    /** Real-world frequency weight, 0 (exotic) – 5 (every project). */
    weight: number;
    /**
     * Internal AOT type names this leaf covers. A leaf is T-covered when at
     * least one of them is creatable through the tool path.
     */
    aotTypes?: string[];
    /** KNOWLEDGE_BASE entry ids that teach this leaf (K). */
    knowledgeIds?: string[];
    /** Eval case ids that prove it (E). Exact ids — a rename must show up. */
    caseIds?: string[];
    /** …or any case carrying all of these tags (E). */
    caseTags?: string[];
    /** Why this leaf is deprioritised / what is missing. Shown in COVERAGE.md. */
    note?: string;
}
export declare const TAXONOMY: CoverageLeaf[];
//# sourceMappingURL=taxonomy.d.ts.map