/**
 * BP-rule moniker lookup, search, and _BPSuppressions.xml generation.
 *
 * Backed by BP_MONIKER_CATALOG (catalog.generated.ts) — real data extracted
 * from a local D365FO install (see scripts/extract-bp-catalog.ps1), not a
 * hand-typed list. That distinction matters: a moniker typed from memory has
 * been wrong before (issue: proposed a moniker that turned out not to exist,
 * caught only by reading the xppc log by hand). Every lookup here either
 * confirms a real moniker or says plainly that it does not recognise one. It
 * may offer candidates alongside a miss, but never silently resolves a typo
 * into one of them — `found` stays false and the caller must confirm.
 *
 * Two things the catalog does NOT prove, both of which callers used to get
 * wrong: an entry with `canonical: false` came only from a rule DLL's resource
 * strings, a source that also contains non-BP messages; and the suppression
 * shape below follows what real AxIgnoreDiagnosticList files contain, measured
 * across all 299 of them, not what one sampled entry happened to look like.
 */
import { BP_MONIKER_CATALOG, type BpMonikerEntry } from './catalog.generated.js';
export interface MonikerValidation {
    moniker: string;
    /** True if the exact name (case-insensitive) is in the catalog at all. */
    found: boolean;
    /** True if it also appears in at least one model's AxRuleSet/BPRules.xml — the strongest confirmation. */
    canonical: boolean;
    entry: BpMonikerEntry | null;
    /**
     * Catalog names sharing words with the input, when the exact lookup missed.
     * Suggestions only: `found` stays false and the caller must present these as
     * candidates to confirm, never as a correction. Populated by splitting the
     * input's PascalCase into words and reusing the same token search the
     * `search` action uses — so a near-miss typo lands on the real name instead
     * of dead-ending into another round trip.
     */
    suggestions: string[];
}
/**
 * Look up an exact moniker (case-insensitive). Does not fuzzy-match — a typo
 * comes back as "not found" with suggestions attached, never silently resolved
 * to something else.
 */
export declare function validateMoniker(moniker: string): MonikerValidation;
export interface MonikerSearchResult {
    entry: BpMonikerEntry;
    /** Number of distinct query tokens matched, in moniker name + message + description. */
    score: number;
    matchedIn: Array<'moniker' | 'message' | 'description'>;
}
/**
 * Search the catalog by free text against real rule text — the moniker name
 * (PascalCase words split apart), message template, and description.
 *
 * This is keyword/token overlap, not embeddings — it is only as good as the
 * words shared between the query and the real rule text. Text coverage is
 * high, not sparse: 545 of 577 entries carry a real message (94%), and 221
 * also carry a description. Only 32 entries are name-only, and a miss is
 * therefore reasonably informative — do not tell callers to discount it.
 * What the search cannot do is match a paraphrase sharing no words with the
 * rule text. Callers should show `matchedIn` and the real description so a
 * human/agent can judge the fit — never present the top hit as certain.
 */
export declare function searchMonikers(query: string, limit?: number): MonikerSearchResult[];
/**
 * Top-level AOT element types observed in real AxIgnoreDiagnosticList files.
 *
 * Measured, not assumed: every <Diagnostic> in all 299 *_BPSuppressions.xml /
 * AxIgnoreDiagnosticList files of a 10.0 PackagesLocalDirectory was parsed
 * (19,619 blocks carrying both <Path> and <ElementType>; 10,915 of them
 * DiagnosticType=BestPractices). This list is the set of types whose element
 * name alone determines the whole path — see PATH_SEGMENT below for the rule
 * and for why sub-element types are deliberately absent.
 */
export type SuppressionElementType = 'AxClass' | 'AxTable' | 'AxForm' | 'AxView' | 'AxMap' | 'AxEnum' | 'AxQuerySimple' | 'AxDataEntityView' | 'AxAggregateMeasurement' | 'AxAggregateDimension' | 'AxSecurityPrivilege' | 'AxSecurityDuty' | 'AxSecurityRole' | 'AxTableExtension' | 'AxFormExtension' | 'AxMenuExtension' | 'AxMenu' | 'AxMenuItemDisplay' | 'AxMenuItemAction' | 'AxMenuItemOutput' | 'AxEdtString' | 'AxEdtInt' | 'AxEdtInt64' | 'AxEdtEnum' | 'AxEdtReal' | 'AxEdtDate' | 'AxEdtGuid' | 'AxConfigurationKey' | 'AxLicenseCode';
export interface BuildSuppressionInput {
    moniker: string;
    /**
     * The exact dynamics:// path from the BP finding. Preferred over
     * elementType+elementName: it is the only way to address a sub-element
     * (a control, a field, a method, an enum value) and it is what the finding
     * hands you anyway. Given this, elementType/elementName are not needed.
     */
    path?: string;
    /** Top-level element type, used only to derive `path` when `path` is absent. */
    elementType?: SuppressionElementType;
    /** The object the warning was raised against, e.g. a privilege or table name. */
    elementName?: string;
    /** Why this warning is being ignored. Real files carry one on 95% of entries; without it the block is incomplete. */
    justification?: string;
    /** The real message text from the finding. Omitted from the output when absent rather than invented. */
    message?: string;
    severity?: 'Error' | 'Warning';
    /**
     * Emit the <ItemSpecific> block. Off by default — only 999 of 10,915 real
     * BestPractices entries carry it, and always for element-specific rules
     * (BPErrorUnknownLabel, BPXmlDoc*, BPErrorPrivilegeNotCoveredByDuty …).
     * Requires elementName.
     */
    itemSpecific?: boolean;
}
export interface BuildSuppressionResult {
    xml: string;
    /** Blocking problems — the XML is still returned, but it should not be pasted as-is. */
    errors: string[];
    /** Non-blocking notes the caller must surface (unknown moniker, missing justification, …). */
    warnings: string[];
}
/**
 * Render one <Diagnostic> block for
 * {Model}/{Model}/AxIgnoreDiagnosticList/{Model}_BPSuppressions.xml.
 *
 * Element order and optionality follow what real files actually contain, not
 * what one sampled entry happened to show. Across 10,915 real BestPractices
 * blocks: <Justification> 95%, <Message> 43%, <ElementType> 13%,
 * <ItemSpecific> 9%. Microsoft's own template comment at the top of those
 * files lists exactly DiagnosticType, Severity, Path, Moniker, Justification
 * — so that is what is always emitted, and the three rarer elements only when
 * the caller supplies the data for them.
 *
 * Nothing here is invented: no message is fabricated when none is known, and
 * no justification is written on the caller's behalf — a missing one is
 * reported as a warning and marked with an obvious TODO, because a
 * suppression whose reason is blank is what a reviewer rejects.
 */
export declare function buildSuppressionXml(input: BuildSuppressionInput): BuildSuppressionResult;
export { BP_MONIKER_CATALOG, type BpMonikerEntry };
//# sourceMappingURL=index.d.ts.map