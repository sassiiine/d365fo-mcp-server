/**
 * Shared AxEdtExtension XML builder.
 *
 * Both createD365File.ts and generateD365Xml.ts delegate here so the two copies
 * cannot drift — the same reason queryViewXml.ts and mapXml.ts exist.
 *
 * An EDT extension owns no properties of its own: everything it changes about the
 * base EDT is an <AxPropertyModification> Name/Value pair. Shape and element order
 * are copied from the shipped elements, e.g.
 *   ApplicationSuite\Foundation\AxEdtExtension\DocuOverdueFineTxt_FR.Extension.xml
 *     <Name>, <ArrayElements />, <PropertyModifications>
 * All 13 EDT extensions shipped in PackagesLocalDirectory carry <ArrayElements />,
 * so it is emitted unconditionally. Element ORDER matters: the metadata
 * deserializer silently drops children it meets out of order.
 */
export interface AxPropertyModificationSpec {
    name: string;
    value: unknown;
}
/**
 * @param name  Full extension element name, dot notation: BaseEdt.<Prefix>Extension
 * @param properties  label / helpText / stringSize / extends / formHelp, plus
 *   `propertyModifications: [{ name, value }]` as the escape hatch for anything
 *   not named above. An explicit entry wins over the named shortcut for the
 *   same property.
 */
export declare function buildAxEdtExtensionXml(name: string, properties?: Record<string, any>): string;
//# sourceMappingURL=edtExtensionXml.d.ts.map