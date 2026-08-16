/**
 * Shared AxDataEntityViewExtension XML builder.
 *
 * Both createD365File.ts and generateD365Xml.ts delegate here so the two copies
 * cannot drift — the same reason edtExtensionXml.ts, queryViewXml.ts and
 * mapXml.ts exist.
 *
 * Regression: `data-entity-extension` used to go through
 * generateAxSimpleExtensionXml(rootElement, name), which takes no `properties`
 * at all. Every field, field-group and property modification the caller passed
 * was silently dropped and the element came out as an inert
 *     <AxDataEntityViewExtension><Name>…</Name><PropertyModifications /></…>
 * which builds green (the deserializer defaults the missing containers) but
 * surfaces nothing over OData.
 *
 * Shape and element ORDER are copied from the shipped elements, e.g.
 *   ApplicationSuite\Foundation\AxDataEntityViewExtension\CurrencyEntity.Extension.xml
 *     <Name>, <DataSources>, <FieldGroupExtensions>, <FieldGroups>,
 *     <FieldModifications>, <Fields>, <Mappings>, <PropertyModifications>,
 *     <Relations>
 * (i.e. Name first, then the containers alphabetically). Order matters: the
 * metadata deserializer silently drops children it meets out of order.
 * The containers this builder has no property contract for — DataSources,
 * FieldGroups, FieldModifications, Mappings, Relations — are emitted
 * self-closed, exactly as the majority of shipped elements carry them.
 *
 * Nested <AxDataEntityViewField> carries `xmlns=""` plus the
 * `i:type="AxDataEntityViewMappedField"` discriminator in 100% of shipped
 * files; both are reproduced verbatim.
 *
 * KNOWN GAP (deliberate, not an oversight): there is no *repair* route. The
 * modify path accepts `data-entity-extension` but the type is not in
 * BRIDGE_MODIFY_TYPES (src/bridge/bridgeAdapter.ts) and the direct-XML fallbacks
 * cover only replace-code / modify-property / add-control / add-index / add-menu-item —
 * none of them add a mapped field. So an existing AxDataEntityViewExtension
 * cannot be extended with another field in place; write the whole element in one
 * create call. Adding an `add-field` route means touching BOTH <Fields> and the
 * matching <FieldGroupExtensions> entry, which is a change of its own.
 */
export interface AxDataEntityViewExtensionFieldSpec {
    /** Entity-side field name (what OData exposes). */
    name: string;
    /** Table-side field it binds to. Defaults to `name`. */
    dataField?: string;
    /** Entity data-source name. Falls back to properties.dataSource. */
    dataSource?: string;
    label?: string;
    helpText?: string;
    mandatory?: string;
    allowEdit?: string;
    allowEditOnCreate?: string;
    accessModifier?: string;
    countryRegionCodes?: string;
    isComputedField?: string;
}
export interface AxDataEntityViewExtensionFieldGroupSpec {
    /** Name of the base entity's field group being extended, e.g. AutoReport. */
    name: string;
    /** Entity field names appended to that group. */
    fields: string[];
}
/**
 * ONE <AxDataEntityViewField> element, indented for the <Fields> collection.
 *
 * Exported so the modify path (add-field on an existing extension) emits the same
 * bytes as the create path instead of growing a second copy of the element order —
 * order is not cosmetic here, the metadata deserializer silently drops children it
 * meets out of order.
 */
export declare function buildAxDataEntityViewFieldXml(field: AxDataEntityViewExtensionFieldSpec, defaultDataSource?: string): string;
/**
 * @param name  Full extension element name, dot notation: BaseEntity.<Prefix>Extension
 * @param properties
 *   - `fields`: [{ name, dataField?, dataSource?, … }] mapped fields added to the entity.
 *   - `dataSource`: default entity data-source name for fields that do not name their own.
 *     A wrong value here is a hard compile error, so a field with neither is skipped
 *     rather than emitted half-bound.
 *   - `fieldGroupExtensions`: [{ name, fields: [] }] appends the new fields to an
 *     existing field group (AutoReport is what the shipped extensions use).
 *   - `propertyModifications`: [{ name, value }] for entity-level properties.
 */
export declare function buildAxDataEntityViewExtensionXml(name: string, properties?: Record<string, any>): string;
//# sourceMappingURL=dataEntityViewExtensionXml.d.ts.map