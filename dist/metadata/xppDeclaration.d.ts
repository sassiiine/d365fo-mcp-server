/**
 * X++ method declaration parser.
 *
 * Shared by the signature tool (src/tools/methodSignature.ts) and the XML
 * metadata parser (src/metadata/xmlParser.ts) — both used to carry their own
 * regex-based extractor, and both got multi-line declarations wrong in
 * different ways.
 *
 * X++ declarations routinely wrap the parameter list across several lines
 * (every standard construct/new* pattern with defaulted params does), so the
 * declaration is located by position and closed by balanced-paren scanning —
 * never by assuming it fits on one line, and never by stopping at the first
 * ')' (which sits inside defaults like `= classStr(FormletterService)`).
 *
 * A parse that cannot be trusted returns null so callers fall through to their
 * own fallbacks, rather than emitting a confidently wrong signature.
 */
export interface XppDeclaration {
    /**
     * The method name as spelled in the source. X++ identifiers are
     * case-insensitive, so a caller's `CONSTRUCT` locates the declaration of
     * `construct` — callers that render a name should prefer this one (#691).
     */
    name: string;
    modifiers: string[];
    returnType: string;
    parameters: XppDeclarationParameter[];
}
/** Rendered for a parameter list that could not be read; not legal X++, so it can't collide with a real one. */
export declare const UNKNOWN_PARAMETER_LIST = "...";
/** The subset of a method that `renderMethodSignature` needs. */
export interface RenderableMethod {
    name: string;
    returnType?: string;
    parameters?: ReadonlyArray<{
        type: string;
        name: string;
        defaultValue?: string;
    }> | null;
    /** See XppMethodInfo.parametersUnknown. */
    parametersUnknown?: boolean;
}
/**
 * Render `ReturnType name(Type _a, Type _b = default)` for the symbol index.
 *
 * Defaults are kept and an unreadable list renders as `(...)`, never `()` —
 * resolve_references reads this string back and gates writes on it, so `()` is
 * a positive claim of zero parameters that consumers act on.
 */
export declare function renderMethodSignature(method: RenderableMethod): string;
/** X++ access modifiers, as they may appear on a class or method line. */
export type XppVisibility = 'public' | 'private' | 'protected' | 'internal';
export interface XppClassHeader {
    kind: 'class' | 'interface';
    name: string;
    extends?: string;
    implements: string[];
    isAbstract: boolean;
    isFinal: boolean;
    /**
     * The access modifier as WRITTEN on the class line; undefined when the source
     * states none. Deliberately not defaulted to 'public' (which is what an X++
     * class without a modifier is): callers rebuild the declaration line from this
     * header, and an effective value would make `class Foo` come back out as
     * `public class Foo` — a line the source does not contain. Roughly one AOT
     * class in three is `internal`, and the modifier used to be read here and
     * dropped, so no reader could see it at all (#902).
     */
    visibility?: XppVisibility;
}
export interface XppDeclarationParameter {
    type: string;
    name: string;
    defaultValue?: string;
}
export interface XppExtensionOf {
    /** Base object being extended — the intrinsic's first argument. */
    baseObjectName: string;
    /** Intrinsic minus its `Str` suffix, lowercased: 'class', 'table', 'formdatasource', … */
    baseKind: string;
    /**
     * Second argument of the two-argument intrinsics — the data source name for
     * `formDataSourceStr(Form, DataSource)`, the control name for
     * `formControlStr(Form, Control)`. Undefined for the single-argument forms.
     */
    memberName?: string;
}
/**
 * Parse the header of an AxClass `<SourceCode><Declaration>` CDATA block —
 * `[attributes] [modifiers] class Name [extends Base] [implements A, B] {`.
 *
 * The inheritance clause exists ONLY as X++ text here; AxClass XML has no
 * <Extends>/<Implements>/<IsAbstract>/<IsFinal> elements, so reading those
 * (as this parser used to) yields undefined for every class in the AOT.
 *
 * Two traps this avoids, both measured against the real AOT:
 *  - The header routinely wraps across lines (~17% of implements lists are
 *    multi-line), so it is closed by the body's '{', never by end-of-line.
 *  - Doc comments above the class say things like "extends the base class",
 *    so a regex over the raw CDATA harvests `extends the`. Comments and
 *    strings are blanked first, and the search is anchored at the class
 *    keyword rather than run over the whole block.
 *
 * Returns null when no class/interface header is present.
 */
export declare function parseXppClassHeader(declaration: string): XppClassHeader | null;
/**
 * The access modifier among a declaration's modifiers, or undefined when none is
 * stated. X++ defaults to public, and this deliberately does not say so — see
 * XppClassHeader.visibility.
 */
export declare function visibilityFromModifiers(modifiers: readonly string[]): XppVisibility | undefined;
/**
 * Read the `[ExtensionOf(<kind>Str(Base[, Member]))]` attribute that marks a
 * class as an extension. In the AOT there is no AxClassExtension artifact —
 * class extensions are ordinary AxClass files, and this attribute is the only
 * reliable signal that one is an extension. The `*_Extension` name convention
 * is not: 87 of 400 classes so named carry no attribute at all.
 *
 * Shapes measured across the AOT that a narrower regex gets wrong:
 *  - Intrinsic case varies freely (`classStr`, `classstr`, `dataentityviewstr`).
 *  - The base need not be a class: `formDataSourceStr`, `formControlStr` and
 *    `dataEntityViewStr` all appear.
 *  - `formDataSourceStr(Form, DataSource)` / `formControlStr(Form, Control)`
 *    take two arguments; the base object is the first.
 *
 * Returns null when no attribute is present.
 */
export declare function parseExtensionOfAttribute(declaration: string): XppExtensionOf | null;
/**
 * True when an X++ method body makes a Chain of Command `next <method>(...)`
 * call — i.e. the method wraps a base implementation rather than adding a new
 * one. Comments are blanked first so "// remember to call next parmId()" in a
 * stub doesn't register as a wrapper.
 */
export declare function callsNext(source: string): boolean;
/**
 * Locate and parse the declaration of `methodName` in X++ source.
 * Returns null when no trustworthy declaration is found.
 *
 * The match is case-insensitive (X++ identifiers are), so the returned `name` is
 * the source's spelling and may differ in case from `methodName`.
 */
export declare function parseXppDeclaration(source: string, methodName: string): XppDeclaration | null;
//# sourceMappingURL=xppDeclaration.d.ts.map