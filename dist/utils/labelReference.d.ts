/**
 * Label reference formatting + deployability annotation.
 *
 * Defect #33/#41 (reproduced twice on the VM): the labels tool advertised
 * `@SYS:@SYS67433` — it built every reference as `@${labelFileId}:${labelId}`
 * without noticing that the indexed label id already carries its own
 * `@FileId` prefix. xppbp rejects that doubled form:
 *   `BPErrorLabelIsText: '@SYS:@SYS67433' is not a label ID`
 * The form xppbp accepts is `@SYS67433`.
 *
 * Second half of the same finding: the tool happily suggests labels from label
 * files that are not deployed/referenced here (`@EnterpriseAssetManagementAppSuite:*`,
 * `@RevenueRecognition:ItemName` → "Unknown label" / `BPErrorUnknownLabel`).
 * Suggesting a reference the model cannot resolve is a defect, so results carry
 * an explicit provenance warning instead of reading as ready-to-use.
 */
/**
 * Canonical X++/metadata label reference for an indexed label row.
 *
 *   ('SYS', '@SYS67433')       → '@SYS67433'   (id already carries its file id)
 *   ('SYS', 'SYS67433')        → '@SYS67433'   (legacy id-embeds-file-id form)
 *   ('ContosoExt', 'MyLabel')  → '@ContosoExt:MyLabel'
 *   ('ContosoExt', '@ContosoExt:MyLabel') → unchanged
 */
export declare function formatLabelReference(labelFileId: string | undefined, labelId: string): string;
/**
 * Inverse of {@link formatLabelReference}: a reference (or a bare id) → the
 * parts a lookup needs.
 *
 *   '@ContosoExt:EquipmentName' → { labelFileId: 'ContosoExt', labelId: 'EquipmentName' }
 *   '@GLS4170035'               → { labelId: 'GLS4170035' }
 *   'GLS4170035'                → { labelId: 'GLS4170035' }
 *   '@SYS:@SYS67433'            → { labelFileId: 'SYS', labelId: '@SYS67433' }
 *
 * The `@` is dropped from the legacy form on purpose: which spelling the index
 * holds depends on the file, so callers pair this with
 * {@link labelIdSpellings} rather than assuming either one.
 */
export declare function parseLabelReference(ref: string): {
    labelFileId?: string;
    labelId: string;
};
/**
 * Every spelling of a label id the index may hold, for one lookup.
 *
 * #888: `labelParser` stores the `Key=` token verbatim, and the 27 legacy AX-era
 * label files (SYS SYP GLS … WAX — 865k of the 1.42M indexed rows on the
 * reference environment) write theirs WITH the sigil: `@GLS4170035=Accountants`.
 * Modern files write `EquipmentName=`. A lookup that matches one spelling
 * therefore misses whichever set it did not guess, which is why
 * `labels(action="info", labelId="GLS4170035")` reported "not found" for a label
 * it had just listed the file of.
 *
 * Uppercasing is applied to the legacy shape only. Every key in the 27 files is
 * all-uppercase (verified across them), so `@sys67433` is recoverable for free;
 * a modern id's casing is the author's and is left alone.
 */
export declare function labelIdSpellings(labelId: string): string[];
/**
 * True when a label reference is safe to hand to the model as-is: it lives in a
 * core label file or in the caller's own model. Anything else may raise
 * `BPErrorUnknownLabel` because its owning package is not referenced.
 */
export declare function isLabelLikelyResolvable(labelFileId: string | undefined, labelModel: string | undefined, currentModel?: string): boolean;
/** Short inline warning for a label whose owning package may not be referenced. */
export declare function labelProvenanceWarning(labelModel: string | undefined): string;
/**
 * One warning for a whole result set instead of one per row (#832): repeating
 * {@link labelProvenanceWarning} on every hit cost ~2,5 kB per search and said
 * the same sentence up to 30 times. `models` are the distinct owners of the
 * flagged rows, in result order.
 */
export declare function crossModelLabelWarning(models: string[], flaggedCount: number): string;
//# sourceMappingURL=labelReference.d.ts.map