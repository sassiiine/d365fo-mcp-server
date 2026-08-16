/**
 * Does an indexed label actually exist in its .label.txt on disk?
 *
 * The symbol index is a snapshot. When it is ahead of the file system — a label
 * row from a run that was rolled back, a model rebuilt outside the server, an
 * index written before a git checkout — `labels(action="info")` answers with a
 * full translation list for a label that is not in any file. Downstream, the
 * caller reuses that "existing" label in XML and the failure only surfaces as a
 * best-practice error at build time: `Unknown label '@Model:LabelId'`. Observed
 * in a live demo (2026-08-07), together with a phantom enum and a phantom field.
 *
 * The check is deliberately one-way. A label the file HAS is never questioned,
 * and any doubt — unreadable path, no indexed path, oversized file — reports
 * `null` ("could not verify") rather than a verdict. Only "the file reads fine
 * and this id is not in it" is worth telling the caller about, because that one
 * is always a real defect in what they were about to build on.
 */
/**
 * `true`  — the file was read and does NOT declare the label (index is stale),
 * `false` — the file declares it,
 * `null`  — could not verify; say nothing.
 */
export declare function labelMissingOnDisk(labelId: string, filePaths: string[]): Promise<boolean | null>;
//# sourceMappingURL=labelDiskCheck.d.ts.map