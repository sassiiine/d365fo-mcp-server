/**
 * properties.fields         — [{ name, type?, edt?|extendedDataType?, enumType?, stringSize? }]
 *                              `edt` is the primary key (matches the `table`/`table-extension`
 *                              field-spec convention used everywhere else in this tool's
 *                              properties shapes); `extendedDataType` is accepted as an alias
 *                              since it matches the emitted XML element name — a caller using
 *                              either spelling gets an EDT written, instead of it being silently
 *                              dropped (regression: eval/corpus/runs/
 *                              2026-07-06T18__L1-map-basic__cb1b73d.json — `map` had NO entry in
 *                              the properties documentation at all, so a caller reasonably
 *                              guessed `edt` from the table convention and it was silently lost).
 * properties.mappingTable   — name of the underlying AxTable this map targets.
 * properties.mappings       — [{ mapField, mapFieldTo }] connections into that table.
 *                              Defaults to one connection per field (mapFieldTo = name)
 *                              when the caller didn't specify explicit mappings.
 */
export declare function buildAxMapXml(mapName: string, properties?: Record<string, any>): string;
//# sourceMappingURL=mapXml.d.ts.map