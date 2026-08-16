/**
 * EDT Extension Validator
 *
 * Enforces D365FO rules about what can and cannot be changed via an
 * AxEdtExtension. The XPP compiler / runtime silently accepts some edits
 * that the metadata system rejects — so we gate them up-front and explain
 * the proper alternative.
 *
 * Key rules:
 *
 *   1. **StringSize** can only be modified on a *root* string EDT (one that
 *      does NOT have <Extends>). For derived EDTs, StringSize is inherited
 *      and must be widened by either:
 *        - deriving a new EDT from the inherited one with the larger size, or
 *        - using a table extension to point the field at a wider EDT.
 *
 *   2. **DisplayLength** follows the same inheritance rule as StringSize.
 *
 *   3. **Extends** cannot be changed on an extension — that would mean
 *      re-parenting the base EDT.
 *
 *   4. Most "annotation"-style properties (Label, HelpText, FormHelp,
 *      ConfigurationKey, HelpAlign, Alignment, NoOfDecimals on real,
 *      DecimalSeparator, SignDisplay) are always allowed on extensions
 *      regardless of whether the base EDT carries them itself.
 *
 *   5. The base EDT must be marked IsExtensible = true. Microsoft EDTs
 *      typically are; user-created EDTs default to false. We can only check
 *      this when the bridge is connected.
 */
import type { BridgeClient } from '../bridge/bridgeClient.js';
export interface EdtBaseInfo {
    edtName: string;
    /** Parent EDT name (Extends), or null/undefined when this is a root EDT. */
    extends?: string | null;
    /** Current string size (raw string from edt_metadata) — root EDTs only. */
    stringSize?: string | null;
    /**
     * Maximum size of the underlying SQL column (`<DatabaseStringSize>` in XML).
     * `-1` means unlimited (memo). When set and > 0, `StringSize` must not exceed it.
     * Inherited through the Extends chain when not specified locally.
     */
    databaseStringSize?: string | null;
    /** From bridge, when available; null/undefined when SQLite-only lookup. */
    isExtensible?: boolean | null;
}
export interface EdtExtensionValidationResult {
    ok: boolean;
    message?: string;
}
/**
 * Parse an edt-extension objectName into its base EDT name.
 *
 * Convention: BaseEdtName.MyExtension or BaseEdtName_MyExtension.
 * If no separator is found, the input is returned as-is (assumed already a base name).
 */
export declare function extractBaseEdtName(extensionObjectName: string): string;
/**
 * Look up the base EDT in the SQLite symbol index.
 * Returns null when the EDT is not indexed.
 *
 * When the same edt_name exists in multiple models (e.g. a model layered on
 * top of a Microsoft EDT), prefer the row that carries the most information
 * — specifically a non-null `extends` and a non-null `string_size`.
 * Otherwise we may falsely conclude that an EDT is a *root* (no Extends) and
 * permit a forbidden StringSize change via extension.
 */
export declare function lookupBaseEdtFromIndex(db: any, baseEdtName: string): EdtBaseInfo | null;
/**
 * Resolve the *root* EDT in the inheritance chain starting at baseEdtName.
 *
 * Walks Extends pointers until we hit an EDT with no Extends. Returns the
 * full chain so callers can show "MyAccountNum → AccountNum → Num" hints.
 */
export declare function resolveEdtChain(db: any, baseEdtName: string, maxDepth?: number): EdtBaseInfo[];
/**
 * Resolve the effective `DatabaseStringSize` for an EDT.
 *
 * `<DatabaseStringSize>` is inherited through the Extends chain just like
 * `<StringSize>`. We walk up until we find a non-null value; `-1` means the
 * underlying SQL column is unlimited (memo / nvarchar(max)).
 *
 * Returns:
 *   - a positive integer when the chain has an explicit size,
 *   - `-1` when any level in the chain says "unlimited",
 *   - `null` when nothing in the chain specifies it (caller should not block).
 */
export declare function resolveEffectiveDatabaseStringSize(db: any, baseEdtName: string, maxDepth?: number): number | null;
/**
 * Core validation: can `propertyPath` be set to `propertyValue` on an
 * AxEdtExtension whose base EDT is `base`?
 *
 * `db` (optional) lets the validator walk the Extends chain to provide a
 * more informative message ("StringSize is inherited from AccountNum (root)").
 */
export declare function validateEdtExtensionProperty(base: EdtBaseInfo, propertyPath: string, propertyValue: string, db?: any): EdtExtensionValidationResult;
/**
 * Convenience wrapper: looks up the base EDT, enriches via bridge when
 * available, and runs validation. Use this from modify_d365fo_file.
 *
 * Returns `{ ok: true }` and lets the caller proceed if everything is fine.
 * Returns `{ ok: false, message }` to be relayed back to the model verbatim.
 */
export declare function validateEdtExtensionChange(extensionObjectName: string, propertyPath: string, propertyValue: string, db: any, bridge: BridgeClient | undefined): Promise<EdtExtensionValidationResult>;
//# sourceMappingURL=edtExtensionValidator.d.ts.map