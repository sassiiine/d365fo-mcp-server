/**
 * Form Design tree walker shared by the XML parser (extraction), the form
 * pattern validator, and the pattern mining pipeline.
 *
 * Input is the <Design> node of an AxForm parsed with xml2js options
 * { explicitArray: false, mergeAttrs: true, trim: true } — i.e. single
 * children are plain objects, repeated children are arrays, and attributes
 * (notably i:type) are merged as keys.
 *
 * Real AxForm XML nests controls as:
 *   <Design>
 *     <Pattern>SimpleList</Pattern>
 *     <PatternVersion>1.1</PatternVersion>
 *     <Controls>
 *       <AxFormControl i:type="AxFormActionPaneControl">
 *         <Name>ActionPane</Name>
 *         <Type>ActionPane</Type>
 *         <Controls>...</Controls>
 *       </AxFormControl>
 *     </Controls>
 *   </Design>
 *
 * Container controls carry their own <Pattern>/<PatternVersion> (sub-patterns).
 * Extension controls (QuickFilter etc.) are plain <AxFormControl> without an
 * i:type, identified by <FormControlExtension><Name>.
 */
/** Normalized node of the form design tree */
export interface FormControlNode {
    name: string;
    /** Normalized control type: i:type minus AxForm/Control affixes (e.g. 'Grid', 'ActionPane', 'TabPage', 'String'), the <Type> element value, or the FormControlExtension name (e.g. 'QuickFilterControl'). */
    type: string;
    /** Raw i:type attribute when present (e.g. 'AxFormGridControl') */
    axType?: string;
    /** Sub-pattern declared on this container (e.g. 'CustomAndQuickFilters') */
    pattern?: string;
    patternVersion?: string;
    properties: Record<string, string>;
    children: FormControlNode[];
}
/** Normalized form Design info */
export interface FormDesignInfo {
    /** Top-level form pattern declared on Design (e.g. 'SimpleList') */
    pattern?: string;
    patternVersion?: string;
    style?: string;
    properties: Record<string, string>;
    controls: FormControlNode[];
}
/** Flat record of one patterned node — input for the form_patterns index table */
export interface PatternNodeRecord {
    /** 'Design' for the form root, else 'Design/Tab[TabHeader]/TabPage[General]'-style path */
    nodePath: string;
    /** '' for the Design root */
    controlName: string;
    /** '' for the Design root, else normalized control type */
    controlType: string;
    pattern: string;
    patternVersion?: string;
    /** Ordered normalized control types of direct children */
    childSequence: string[];
}
/**
 * 'AxFormGridControl' → 'Grid', 'AxFormActionPaneControl' → 'ActionPane', 'AxFormControl' → ''
 * Exception: extension controls like 'QuickFilterControl' keep their full suffix so they
 * match FormControlExtension.Name lookups used by the form pattern validator.
 */
export declare function normalizeControlType(axType: string | undefined): string;
/**
 * Walk a parsed <Design> node into a normalized tree.
 * Tolerates both Design > Controls > AxFormControl and a bare Design > AxForm* shape.
 */
export declare function walkFormDesign(designNode: any): FormDesignInfo;
/**
 * Flatten a design tree into records of every node that declares a pattern
 * (the Design root plus sub-patterned containers) — mining input.
 */
export declare function collectPatternNodes(design: FormDesignInfo): PatternNodeRecord[];
//# sourceMappingURL=formPatternMiner.d.ts.map