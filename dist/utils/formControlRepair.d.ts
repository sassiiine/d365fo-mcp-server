/**
 * Form control repair: auto-fixes a form missing pattern-required top-level
 * controls (FP003). Reads the form's declared pattern, works out which
 * required top-level controls are absent, generates them from the catalog
 * (via the deterministic expander), and splices them into the Design
 * <Controls> collection at the spec-mandated position.
 *
 * The splice is a depth-aware string operation: existing controls are preserved
 * byte-for-byte (children, methods, customisations untouched) — only the
 * missing required controls are inserted. The whole form is never reserialized.
 *
 * Scope: top-level (direct Design child) required controls only. Missing
 * children deeper inside a container, and sub-pattern attachment, are out of
 * scope here (the validator still flags them as warnings/errors for the caller).
 */
import type { FormPatternSpec, NodeSpec } from '../knowledge/formPatterns/index.js';
import { type ExpandFormOptions } from './formControlExpander.js';
export interface RepairResult {
    xml: string;
    /** Controls that were generated and inserted. */
    added: Array<{
        id: string;
        type: string;
    }>;
    /** Required controls that could not be auto-added (non-concrete / no Controls block). */
    unfixable: Array<{
        id: string;
        reason: string;
    }>;
    /** True when the form XML was actually changed. */
    changed: boolean;
}
interface DirectChild {
    /** Normalized control type (e.g. 'ActionPane', 'Grid'). */
    type: string;
    /** Byte offset of this child's `<AxFormControl` within the Controls inner content. */
    start: number;
    /** Byte offset just past this child's `</AxFormControl>`. */
    end: number;
}
/**
 * Locate the Design-level <Controls> collection and return its inner-content
 * span. The Design's own Controls is the first <Controls …> after <Design> —
 * the SourceCode DataSources/DataControls collections live before <Design>, and
 * nested control Controls live deeper. Returns null when the form has no
 * Design or no expandable Controls block (e.g. self-closed and we keep it so).
 */
export declare function findDesignControls(xml: string): {
    innerStart: number;
    innerEnd: number;
    selfClosed: boolean;
    selfCloseAt?: number;
} | null;
/**
 * Scan the Controls inner content for its DIRECT <AxFormControl> children,
 * tracking nesting depth so nested controls are not mistaken for top-level ones.
 */
export declare function scanDirectChildren(inner: string): DirectChild[];
/**
 * Plan which required, concrete root specs are missing from the existing direct
 * children, and the index (in the existing-children array) AFTER which each
 * should be inserted to honour spec order. anchorIndex === -1 means prepend.
 */
export declare function planInsertions(rootSpecs: NodeSpec[], existing: DirectChild[]): {
    missing: Array<{
        spec: NodeSpec;
        anchorIndex: number;
    }>;
    unfixable: Array<{
        id: string;
        reason: string;
    }>;
};
/**
 * Repair a form's missing required top-level controls. Pure — given the form
 * XML, its resolved pattern spec and generation options. Returns the (possibly
 * unchanged) XML plus what was added / could not be fixed.
 */
export declare function repairFormXml(xml: string, spec: FormPatternSpec, opt: ExpandFormOptions): RepairResult;
export {};
//# sourceMappingURL=formControlRepair.d.ts.map