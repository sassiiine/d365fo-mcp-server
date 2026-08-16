/**
 * Create-path parameter honesty for AxTable.
 *
 * Cluster #35 ("a write op silently drops an optional parameter"), create half.
 * Corpus evidence: eval/corpus/runs/2026-07-22T16__L2-config-key-gated-table__0e1e367.json
 *
 *   d365fo_file(action="create", objectType="table",
 *               properties={ configurationKey: "ConDemoModuleKey" })
 *
 * answered ✅ over an AxTable with no <ConfigurationKey> at all and no warning.
 * The same property IS honoured by the menu-item-display writer, so the caller has
 * no way to guess which writers keep their promises. Root cause: the create goes
 * through the bridge's CreateSmartTable, whose C# SetAxTableProperty() switch has
 * no `configurationkey` (nor `formref`) case — the unknown key hits `default:`,
 * logs to the bridge's stderr, and returns false, which CreateSmartTable ignores.
 *
 * This module closes the hole from the TypeScript side, so it works against an
 * OLD bridge binary too (no rebuild required):
 *
 *   1. Every scalar property the caller passed is reconciled against the XML that
 *      was actually written.
 *   2. A property that did not land but CAN be expressed as an AxTable element is
 *      written on disk in canonical order (upsertAxTableProperty — the same repair
 *      the modify surface already uses for FormRef).
 *   3. Anything left over — a property that does not exist at table level, or one
 *      whose value is not legal for its enum — is REPORTED, never dropped silently.
 *
 * Deliberately conservative: a property that is already present in the document is
 * left exactly as the writer produced it (no value overwriting), and a value that
 * equals the serializer-omitted default counts as honoured rather than being
 * written redundantly. Both rules keep this off the golden-metadata diff.
 */
/** A collection whose members are absent from the document that was written. */
export interface DroppedCollection {
    /** The `properties` key the caller used. */
    key: string;
    /** How to name these in prose, e.g. "indexes". */
    plural: string;
    /** Names that were requested but are not in the written XML. */
    missing: string[];
    /** modify operation that can add them back. */
    repair: string;
}
/** A property the create writer accepted but could not honour. */
export interface UnhonouredCreateProperty {
    /** The key as the caller spelled it. */
    name: string;
    /** The value the caller asked for. */
    value: string;
    /** Why it could not be written. */
    detail: string;
}
export interface TableCreateReconcileResult {
    /** The document, with every repairable dropped property written back in. */
    xml: string;
    /** Properties that the writer dropped and this repair wrote on disk. */
    patched: {
        name: string;
        element: string;
        value: string;
    }[];
    /** Properties that could not be written at all — must be surfaced to the caller. */
    unhonoured: UnhonouredCreateProperty[];
    /** Structural collections (indexes/relations/field groups) missing from the written XML. */
    droppedCollections: DroppedCollection[];
}
/**
 * Which of the caller's structural collections are absent from the XML that was
 * written. Membership is checked by name, not by count, because the writer can emit
 * a non-empty container of its OWN making — the five standard field groups are there
 * whether or not the caller's custom group survived.
 */
export declare function findDroppedTableCollections(xml: string, properties: Record<string, unknown> | undefined): DroppedCollection[];
/**
 * Reconcile the properties the caller asked for against the AxTable XML that was
 * actually written. Only scalar values are considered — collections travel as their
 * own bridge parameters and are checked elsewhere.
 */
export declare function reconcileTableCreateProperties(xml: string, properties: Record<string, unknown> | undefined): TableCreateReconcileResult;
/**
 * Caller-facing report for a reconciled table create. Empty string when the writer
 * honoured everything — silence here means "nothing was dropped", which is exactly
 * the guarantee that was missing.
 */
export declare function renderTableCreateHonestyReport(result: TableCreateReconcileResult): string;
//# sourceMappingURL=createTablePropertyHonesty.d.ts.map