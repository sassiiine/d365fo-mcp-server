/**
 * Shared builder for AxMap XML.
 *
 * `map` was not a supported create objectType at all before this (not in the
 * zod enum, no template in either XmlTemplateGenerator copy) — a genuine
 * capability gap rather than a silent-drop bug, found while building the eval
 * Phase 6 map breadth case. Routed through the TypeScript fallback (never
 * added to BRIDGE_CREATE_TYPES) from day one, so it can't inherit the
 * bridge's silent-property-drop behavior seen on query/view/data-entity.
 *
 * Structure verified against a real shipped map read directly off disk
 * (ApplicationFoundation\AxMap\LogMap.xml): fields are typed via an i:type
 * discriminator (AxMapFieldInt, AxMapFieldInt64, AxMapFieldString,
 * AxMapFieldContainer, ...), and a map is wired to an underlying table via
 * <Mappings><AxTableMapping><Connections> entries pairing each map field
 * name (MapField) with the target table's field name (MapFieldTo).
 */
/**
 * properties.fields         — [{ name, type?, extendedDataType?, enumType?, stringSize? }]
 * properties.mappingTable   — name of the underlying AxTable this map targets.
 * properties.mappings       — [{ mapField, mapFieldTo }] connections into that table.
 *                              Defaults to one connection per field (mapFieldTo = name)
 *                              when the caller didn't specify explicit mappings.
 */
export declare function buildAxMapXml(mapName: string, properties?: Record<string, any>): string;
//# sourceMappingURL=mapXml.d.ts.map