/**
 * Placement + serialization for a control added to an AxFormExtension.
 *
 * A form extension expresses a new control in one of TWO mutually exclusive
 * shapes, and which one is correct depends entirely on WHERE the parent lives:
 *
 *   1. Parent is a control of the BASE FORM → an <AxFormExtensionControl>
 *      envelope in the extension's ROOT <Controls>, carrying its own wrapper
 *      <Name>, the real control under <FormControl>, and a <Parent> reference:
 *
 *        <Controls>                                   ← root, child of AxFormExtension
 *          <AxFormExtensionControl xmlns="">
 *            <Name>FormExtensionControlfse38xiwz</Name>
 *            <FormControl xmlns="" i:type="AxFormCheckBoxControl"> … </FormControl>
 *            <Parent>Grid</Parent>
 *          </AxFormExtensionControl>
 *        </Controls>
 *
 *   2. Parent is a container THE EXTENSION ITSELF DEFINES → a bare
 *      <AxFormControl i:type="…"> in that container's NESTED <Controls>. No
 *      envelope and no <Parent>: the nesting already encodes parentage, so a
 *      <Parent> element there is meaningless.
 *
 *        <FormControl xmlns="" i:type="AxFormGroupControl">
 *          <Name>QualityOrders</Name>
 *          <Controls>                                 ← nested
 *            <AxFormControl xmlns="" i:type="AxFormCheckBoxControl"> … </AxFormControl>
 *          </Controls>
 *          <DataGroup>QualityOrders</DataGroup>
 *        </FormControl>
 *
 * The previous implementation built shape 1 unconditionally and spliced it in
 * with `content.replace('</Controls>', …)`. A string pattern replaces the FIRST
 * occurrence, and when the extension defines its own container the nested
 * </Controls> closes first — so the envelope landed inside the nested
 * collection, which is typed to AxFormControl. `parentControl` was never
 * resolved to a node at all; it only supplied the <Parent> text. The result was
 * well-formed XML in the wrong collection, reported as a success.
 *
 * This module resolves the parent against the extension's own control tree and
 * derives BOTH the representation and the insertion offset from where that
 * parent turns out to live. Pure and side-effect-free so it is trivially
 * testable — the file I/O stays in the caller.
 */
export interface FormExtPlacementProblem {
    /** The misplaced element. */
    element: string;
    /** 1-based line in the supplied XML. */
    line: number;
    detail: string;
}
/**
 * Check that every control element sits in a collection typed to hold it.
 *
 * This exists because of how the platform actually behaves, measured 2026-08-12
 * by compiling the malformed file: an <AxFormExtensionControl> inside a nested
 * <Controls> does NOT fail the build. xppc returns 0 errors — the deserializer
 * silently DISCARDS the node. The control never reaches the form, and the only
 * trace is a metadata WARNING, and only when the parent happens to be
 * <DataGroup>-bound so there are two field sets to compare:
 *
 *   Metadata Warning: …/Controls/FormExtensionControl…/…/DataGroup: The form
 *   control has different fields from the field group '…' it is bound to.
 *   Use restore on the form control.
 *
 * That warning names neither the malformed node nor the control, and it arrived
 * among 52 pre-existing warnings. For a parent that is NOT DataGroup-bound there
 * is nothing to compare, so the discard is expected to be entirely silent.
 *
 * A compiler that stays quiet is the whole problem: nothing downstream will ever
 * catch this, so the check has to happen here, before the write. Name-based
 * validation (formExtensionShapeValidator) cannot see it — every element in the
 * malformed file is spelled correctly; only its POSITION is wrong.
 */
export declare function findFormExtensionPlacementProblems(xml: string): FormExtPlacementProblem[];
/** Render placement problems as a blocking, self-explaining error. */
export declare function buildFormExtensionPlacementError(objectName: string, problems: FormExtPlacementProblem[]): string;
export interface FormExtensionControlSpec {
    controlName: string;
    parentControl: string;
    /** Element name emitted as i:type, e.g. "AxFormCheckBoxControl". */
    iType: string;
    /** <Type> value, e.g. "CheckBox". */
    typeValue: string;
    dataSource?: string;
    dataField?: string;
    label?: string;
    /**
     * Wrapper <Name> for the envelope shape. Injected rather than generated here so
     * this module stays deterministic; ignored for the nested shape, which has no
     * wrapper.
     */
    wrapperName: string;
    /**
     * Name of the existing sibling to place the control after.
     *
     * Nested shape: the control is spliced directly after that sibling in the
     * parent's <Controls>. Envelope shape: position among the BASE FORM's children
     * is not expressible by splice order, so it is written as
     * <PositionType>AfterItem</PositionType><PreviousSibling>…</PreviousSibling>.
     */
    previousSibling?: string;
    /** "AfterItem" (needs previousSibling), "Begin", or "End" (default). Envelope shape only. */
    positionType?: string;
}
export type InsertFormExtensionControlResult = 
/** Control written. `representation` says which of the two shapes was emitted. */
{
    kind: 'inserted';
    xml: string;
    representation: 'envelope' | 'nested';
    notes: string[];
}
/** A control with this name is already present — nothing to do. */
 | {
    kind: 'exists';
}
/** Understood the file, but writing would be wrong. `message` is caller-facing. */
 | {
    kind: 'refused';
    message: string;
}
/** Not a shape this writer recognises; the caller should fall through. */
 | {
    kind: 'unsupported';
};
/**
 * Insert a control into an AxFormExtension, choosing shape AND location from
 * where `parentControl` actually lives.
 */
export declare function insertFormExtensionControl(xml: string, spec: FormExtensionControlSpec): InsertFormExtensionControlResult;
/**
 * The message for output this writer refuses to persist.
 *
 * It takes the DOCUMENT and derives the object name itself rather than accepting
 * a pre-picked string, because picking it at the call site is what went wrong:
 * the control name was passed into a parameter named `objectName`, so the banner
 * read `form-extension "NewCtl"` and never named the file the very next sentence
 * asks the reader to attach. Two names are in play and only one identifies the
 * object; deriving it here leaves the call site nothing to get wrong.
 *
 * Exported for tests. Ordinary input cannot reach it — the writer's output is
 * clean on all 1088 shipped extensions, and escaping closed the one route that
 * made it reachable — so a caller-level test cannot cover it.
 */
export declare function buildAbandonedWriteMessage(xml: string, controlName: string, introduced: FormExtPlacementProblem[]): string;
//# sourceMappingURL=formExtensionControlXml.d.ts.map