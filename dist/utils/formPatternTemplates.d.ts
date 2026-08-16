/**
 * D365FO Form Pattern Templates
 *
 * Each static method generates a complete, pattern-correct AxForm XML skeleton
 * validated against real AOT forms from K:\AosService\PackagesLocalDirectory.
 *
 * Reference forms used:
 *   SimpleList        → CustGroup.xml         (ApplicationSuite\Foundation)
 *   SimpleListDetails → PaymTerm.xml          (ApplicationSuite\Foundation)
 *   DetailsMaster     → CustTable.xml         (ApplicationSuite\Foundation)
 *   DetailsTransaction→ SalesTable.xml        (ApplicationSuite\Foundation)
 *   Dialog            → ProjTableCreate.xml   (ApplicationSuite\Foundation)
 *   TableOfContents   → CustParameters.xml    (ApplicationSuite\Foundation)
 *   Lookup            → SysLanguageLookup.xml (ApplicationPlatform)
 */
import { type FieldControlMap } from './fieldControlTypes.js';
export interface FormTemplateOptions {
    /** Form name (also used for classDeclaration) */
    formName: string;
    /** Primary datasource name (usually same as table name) */
    dsName?: string;
    /** Primary datasource table name */
    dsTable?: string;
    /** Caption label text or label reference (@Model:Label) */
    caption?: string;
    /** Field names to put in the grid (for SimpleList, Lookup, etc.) */
    gridFields?: string[];
    /** Section definitions for TableOfContents / Dialog */
    sections?: Array<{
        name: string;
        caption: string;
    }>;
    /** Lines datasource name for DetailsTransaction */
    linesDsName?: string;
    /** Lines datasource table name for DetailsTransaction */
    linesDsTable?: string;
    /** Field names to show in the lines grid (DetailsTransaction) */
    linesFields?: string[];
    /**
     * Field → control-type map for the primary table. When provided, field
     * controls render with the correct type (ComboBox for enums, Date for dates,
     * …) instead of defaulting every field to a string control.
     */
    fieldTypes?: FieldControlMap;
    /** Field → control-type map for the lines table (DetailsTransaction). */
    linesFieldTypes?: FieldControlMap;
    /**
     * The datasource table's `TitleField1` — the field a DetailsMaster header
     * title control must bind to. When omitted the first grid field is used, which
     * is only ever right by accident: grid fields arrive in ALPHABETICAL order, so
     * the title ends up bound to whatever field sorts first
     * (docs/eval-sweep-findings-2026-07-21.md #32).
     */
    titleField?: string;
}
/**
 * A form control that carries `<DataGroup>` MUST also carry a sibling
 * `<DataSource>`; the field group is resolved on that datasource's table. Without
 * it a full build fails with `Field group 'Overview' does not exist` — and an
 * INCREMENTAL build passes it silently, which is why this survived several
 * captures (docs/eval-sweep-findings-2026-07-21.md #32, HEADLINE (b)).
 */
/** Supported top-level D365FO form patterns */
export type FormPattern = 'SimpleList' | 'SimpleListDetails' | 'DetailsMaster' | 'DetailsTransaction' | 'Dialog' | 'TableOfContents' | 'Lookup' | 'ListPage' | 'Workspace';
export declare class FormPatternTemplates {
    /**
     * Render a single field input control with the correct control type.
     *
     * `indent` is the tab string for the opening `<AxFormControl>` line; child
     * elements are emitted one tab deeper and the `i:type` attribute two tabs
     * deeper, matching the surrounding AOT layout. The control type is resolved
     * from `types` (enum→ComboBox, date→Date, …); unknown fields fall back to a
     * string control.
     */
    static fieldControl(field: string, dsName: string, indent: string, namePrefix?: string, types?: FieldControlMap): string;
    static buildSimpleList(opt: FormTemplateOptions): string;
    static buildSimpleListDetails(opt: FormTemplateOptions): string;
    static buildDetailsMaster(opt: FormTemplateOptions): string;
    static buildDetailsTransaction(opt: FormTemplateOptions): string;
    static buildDialog(opt: FormTemplateOptions): string;
    static buildTableOfContents(opt: FormTemplateOptions): string;
    static buildLookup(opt: FormTemplateOptions): string;
    static buildListPage(opt: FormTemplateOptions): string;
    static buildWorkspace(opt: FormTemplateOptions): string;
    static build(pattern: FormPattern, opt: FormTemplateOptions): string;
    /**
     * Map common pattern name aliases to canonical FormPattern values.
     * Handles various casing and abbreviation styles the AI or user might use.
     */
    static normalizePattern(raw: string): FormPattern;
}
//# sourceMappingURL=formPatternTemplates.d.ts.map