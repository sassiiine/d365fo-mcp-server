/**
 * Form-extension control-shape validator.
 *
 * Catches malformed AxFormExtension control shapes in hand-written `xmlContent`
 * (the escape hatch when add-control can't be used) that would otherwise be
 * silently accepted and then rejected by the D365FO deserializer.
 *
 * Correct shape (verified against shipped standard extensions, e.g.
 * InventItemSampling.AdvancedQualityManagement):
 *
 *   <AxFormExtensionControl xmlns="">
 *     <Name>FormExtensionControl{rand}</Name>
 *     <FormControl xmlns="" i:type="AxFormIntegerControl">
 *       <Name>Field</Name>
 *       <Type>Integer</Type>
 *       <FormControlExtension i:nil="true" />
 *       <DataField>Field</DataField>
 *       <DataSource>Table</DataSource>
 *       <Label>@Model:Label</Label>
 *     </FormControl>
 *     <Parent>ParentControl</Parent>
 *   </AxFormExtensionControl>
 */
export interface FormExtShapeProblem {
    found: string;
    expected: string;
    detail: string;
}
/**
 * Inspect form-extension XML for the known malformed control shapes. Returns an empty
 * array when the shape is fine. Pure + side-effect-free so it is trivially testable.
 */
export declare function validateFormExtensionControlShape(xml: string): FormExtShapeProblem[];
/**
 * Render a blocking error message for the detected problems, including the correct
 * template so the caller can fix the XML in a single edit (no package grepping).
 */
export declare function buildFormExtensionShapeError(objectName: string, problems: FormExtShapeProblem[]): string;
//# sourceMappingURL=formExtensionShapeValidator.d.ts.map