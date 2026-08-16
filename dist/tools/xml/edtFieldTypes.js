import { fieldEdt } from './tableXml.js';
/** EDT base type -> AxTableField element name. */
const BASE_TO_ELEMENT = {
    string: 'AxTableFieldString',
    real: 'AxTableFieldReal',
    int: 'AxTableFieldInt',
    int64: 'AxTableFieldInt64',
    date: 'AxTableFieldDate',
    enum: 'AxTableFieldEnum',
    utcdatetime: 'AxTableFieldUtcDateTime',
    guid: 'AxTableFieldGuid',
    container: 'AxTableFieldContainer',
    time: 'AxTableFieldTime',
};
/**
 * Fill in `fieldType` for any field that binds an EDT the index knows about.
 *
 * Returns a new array; the caller's specs are not mutated. Fields that already
 * carry an explicit `fieldType` are left alone - an explicit request from the
 * caller outranks anything inferred, and the validator will still flag it if it
 * contradicts the EDT.
 */
export async function resolveFieldElementTypes(fields, lookup) {
    if (!lookup || fields.length === 0)
        return fields;
    return Promise.all(fields.map(async (f) => {
        if (f.fieldType)
            return f;
        // An enumType is its own answer and does not need the EDT table.
        if (f.enumType)
            return f;
        const edt = fieldEdt(f);
        if (!edt)
            return f;
        const base = await lookup.baseTypeOf(edt);
        const element = base ? BASE_TO_ELEMENT[base] : undefined;
        return element ? { ...f, fieldType: element } : f;
    }));
}
//# sourceMappingURL=edtFieldTypes.js.map