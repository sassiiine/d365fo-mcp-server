/**
 * validate_form_pattern — structural validator for AxForm XML against the
 * curated D365FO form pattern catalog (src/knowledge/formPatterns).
 *
 * Validates control hierarchy, ordering, sub-pattern usage, pattern versions
 * and datasource expectations. Rules FP001-FP010 (see
 * src/validation/formPatternValidator.ts). Errors block form writes in
 * create_d365fo_file when FORM_PATTERN_ENFORCE is enabled (default: true).
 */
import { z } from 'zod';
export declare const validateFormPatternArgsSchema: z.ZodObject<{
    xml: z.ZodOptional<z.ZodString>;
    formName: z.ZodOptional<z.ZodString>;
    filePath: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare function validateFormPatternTool(request: any, context?: {
    symbolIndex?: any;
}): Promise<any>;
/** FORM_PATTERN_ENFORCE defaults to enabled; set to 'false'/'0' to disable blocking. */
export declare function isFormPatternEnforceEnabled(): boolean;
/** Result of the add-control pre-flight check */
export interface AddControlPatternVerdict {
    /** Sub-pattern declared on the parent container */
    parentPattern: string;
    allowed: boolean;
    allowedTypes: string[] | 'any';
}
/**
 * Pre-flight for d365fo_file(action="modify", operation="add-control"): when the target parent
 * container declares a sub-pattern, check the new control's type against the
 * children that sub-pattern allows. Returns null when the parent cannot be
 * found, declares no pattern, or the pattern is unknown — those cases never
 * block (the compiler / post-validation catches real issues).
 */
export declare function checkAddControlAgainstParentPattern(baseFormXml: string, parentControlName: string, controlType: string): Promise<AddControlPatternVerdict | null>;
/** Result of the add-control DataGroup pre-flight */
export interface AddControlDataGroupVerdict {
    /** Field group the parent container renders (its <DataGroup> value) */
    dataGroup: string;
    /** Datasource the field group resolves against, when the parent declares one */
    dataSource?: string;
    /** Control name the compiler generates for this field: <DataGroup>_<DataField> */
    generatedName: string;
    /** True when the requested controlName is exactly the generated one — a certain build error */
    exactNameCollision: boolean;
}
/**
 * Pre-flight for add-control: refuse to hand-add a BOUND control under a
 * container that carries <DataGroup>.
 *
 * Such a container is populated by the compiler from that table field group —
 * one control per member, named `<DataGroup>_<FieldName>`. Adding the field to
 * the field group (add-field-to-field-group on the table extension) AND an
 * explicit control for it produces "The duplicate name '…' was detected". The
 * duplicate is invisible on disk: only the explicit control is written to a
 * file, so inspecting the XML never reveals it.
 *
 * Returns null when the parent cannot be found, declares no DataGroup, or the
 * new control is unbound (a button or static text in such a group is fine).
 */
export declare function checkAddControlAgainstDataGroup(baseFormXml: string, parentControlName: string, controlDataField: string | undefined, controlName: string | undefined): Promise<AddControlDataGroupVerdict | null>;
/** A control that renders a table field group through its <DataGroup> property */
export interface DataGroupRenderer {
    /** Name of the container control carrying <DataGroup> */
    controlName: string;
    /** Its <DataSource>, when it declares one */
    dataSource?: string;
    /** Control the compiler generates for a member field: <DataGroup>_<FieldName> */
    generatedNameFor: (fieldName: string) => string;
    /** The field group it renders, as spelled in the form XML */
    dataGroup: string;
}
/**
 * Every container in a form that renders a table field group via <DataGroup>.
 *
 * {@link findDataGroupRenderers} answers "is THIS group on the form"; this one
 * answers "which groups are", which is what a caller needs when the answer to
 * the first is no — a field group nothing renders puts the field on no form, and
 * naming the groups that ARE rendered turns that dead end into one call.
 *
 * Returns [] when the XML is unparseable or no container carries a <DataGroup>.
 */
export declare function listDataGroupRenderers(baseFormXml: string): Promise<DataGroupRenderer[]>;
/**
 * The reverse of {@link checkAddControlAgainstDataGroup}: given a field group,
 * find the controls that already render it via <DataGroup>.
 *
 * Same fact, asked one step earlier. The add-control guard can only fire once a
 * form extension exists and a control is being added to it — by then the agent
 * has spent a create it will have to undo. Asked at add-field-to-field-group
 * time, the answer ("this group is already on the form; the control appears by
 * itself") arrives before any of that is written.
 *
 * Returns [] when the XML is unparseable or no container renders the group.
 */
export declare function findDataGroupRenderers(baseFormXml: string, fieldGroupName: string): Promise<DataGroupRenderer[]>;
/**
 * Gate a form write on pattern errors. Returns an MCP error result when the
 * XML has error-severity pattern violations and enforcement is enabled;
 * returns null (optionally with warnings text) when the write may proceed.
 */
export declare function gateOnFormPatternErrors(xmlContent: string, operationDescription: string): Promise<{
    blocked: {
        isError: true;
        content: Array<{
            type: 'text';
            text: string;
        }>;
    } | null;
    warningsText: string | null;
}>;
//# sourceMappingURL=validateFormPattern.d.ts.map