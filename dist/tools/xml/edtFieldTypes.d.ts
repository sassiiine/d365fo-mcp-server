/**
 * Decide a table field's element type from the EDT it binds, using the index.
 *
 * The previous fallback guessed from the EDT's NAME (`baseTypeFromEdtName`),
 * which cannot work in general: AmountMST is a real and TransDate is a date, but
 * neither name says so, and both were emitted as AxTableFieldString. xppc then
 * reports "Data type mismatch" with no indication of which side is wrong.
 *
 * arch_a.edt_types holds the declared base type for ~24k EDTs, so the answer is
 * now a lookup rather than a guess. Name heuristics remain the fallback for EDTs
 * the index has never seen (a customer's own, created this session).
 */
import type { EdtTypeLookup } from '../../validation/edtTypeLookup.js';
import type { AxTableFieldSpec } from './tableXml.js';
/**
 * Fill in `fieldType` for any field that binds an EDT the index knows about.
 *
 * Returns a new array; the caller's specs are not mutated. Fields that already
 * carry an explicit `fieldType` are left alone - an explicit request from the
 * caller outranks anything inferred, and the validator will still flag it if it
 * contradicts the EDT.
 */
export declare function resolveFieldElementTypes(fields: AxTableFieldSpec[], lookup: EdtTypeLookup | null): Promise<AxTableFieldSpec[]>;
//# sourceMappingURL=edtFieldTypes.d.ts.map