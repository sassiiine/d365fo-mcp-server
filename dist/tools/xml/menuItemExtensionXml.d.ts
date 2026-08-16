/**
 * Shared AxMenuItem{Display,Action,Output}Extension XML builder.
 *
 * Both createD365File.ts and generateD365Xml.ts delegate here so the two copies
 * cannot drift — the same reason edtExtensionXml.ts exists.
 *
 * Regression: all three menu-item extension objectTypes went through
 * generateAxSimpleExtensionXml(rootElement, name), which takes no `properties`
 * at all. A menu-item extension changes the base menu item ONLY through
 * property modifications, so dropping `properties` left the objectType with no
 * grounded path whatsoever — the element came out as an inert
 *     <AxMenuItemActionExtension><Name>…</Name><PropertyModifications /></…>
 * that builds green and changes nothing.
 *
 * Shape is pinned against the shipped elements — the only four in
 * PackagesLocalDirectory are
 *   MasterPlanningService\MasterPlanningService\AxMenuItemActionExtension\*.xml
 * and 4/4 carry BOTH the `Microsoft.Dynamics.AX.Metadata.V1` default namespace
 * on the root AND `xmlns=""` on each <AxPropertyModification>, unlike
 * AxEdtExtension which ships without either. The two are a pair: the reset on
 * the child is what puts it back in no-namespace. They are reproduced verbatim
 * rather than normalised to the EdtExtension shape, because these four files are
 * the only ground truth that exists for this element type.
 */
export interface AxMenuItemPropertyModificationSpec {
    name: string;
    value: unknown;
}
export type AxMenuItemExtensionRootElement = 'AxMenuItemDisplayExtension' | 'AxMenuItemActionExtension' | 'AxMenuItemOutputExtension';
/**
 * @param rootElement  AxMenuItem{Display,Action,Output}Extension
 * @param name  Full extension element name, dot notation: BaseMenuItem.<Prefix>Extension
 * @param properties  the named shortcuts above, plus
 *   `propertyModifications: [{ name, value }]` as the escape hatch for anything
 *   not named. An explicit entry wins over the named shortcut for the same
 *   property.
 */
export declare function buildAxMenuItemExtensionXml(rootElement: AxMenuItemExtensionRootElement, name: string, properties?: Record<string, any>): string;
//# sourceMappingURL=menuItemExtensionXml.d.ts.map