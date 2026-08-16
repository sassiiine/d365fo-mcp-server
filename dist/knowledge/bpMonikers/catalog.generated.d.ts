/**
 * GENERATED FILE — do not hand-edit. Regenerate with:
 *   pwsh scripts/extract-bp-catalog.ps1
 *
 * BP-rule moniker catalog, extracted from a local D365FO install:
 *   - `canonical: true` monikers come from the union of every model's
 *     <Model>/<Model>/AxRuleSet/BPRules.xml — the authoritative name list.
 *   - `message`/`description` come from the .NET-authored rule DLLs'
 *     resx-backed resource classes (bin/BPExtensions/*.dll and a couple of
 *     core bin/*.dll) where the rule author provided one. A `null` there
 *     means "not found in a resource class", NOT "not a real rule".
 *   - Presence in this file does NOT by itself mean "BP rule". The resource
 *     dump also yields upgrade- and form-conversion-tool messages, which come
 *     out with `canonical: false`. `canonical` is the field that answers
 *     "is this a BP rule".
 *
 * Extracted from: C:\Users\laeliand\AppData\Local\Microsoft\Dynamics365\10.0.2527.174\PackagesLocalDirectory
 * Generated at:   (stamp with the actual date when regenerating — omitted
 *                  here so re-running with no real change produces no diff)
 */
export interface BpMonikerEntry {
    moniker: string;
    /** Message template (often with '{0}'-style placeholders), or null if not found in a resource class. */
    message: string | null;
    /** What the rule checks, or null if not found in a resource class. */
    description: string | null;
    /** True if this moniker appears in at least one model's AxRuleSet/BPRules.xml. */
    canonical: boolean;
}
export declare const BP_MONIKER_CATALOG: BpMonikerEntry[];
//# sourceMappingURL=catalog.generated.d.ts.map