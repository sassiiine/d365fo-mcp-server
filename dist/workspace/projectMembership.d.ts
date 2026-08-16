/**
 * "Is this object registered in a Visual Studio project?" — asked model-wide.
 *
 * Two callers used to answer this independently and both got it wrong in a
 * different way.
 *
 * `verify_d365fo_project` compared the right thing (the raw `Content Include`)
 * but only ever looked at the ACTIVE project, so an object registered in a
 * sibling project of the same model reported `❌ Not in project` — a hard error
 * for something that compiles perfectly. It is a real distinction, just not a
 * fatal one: 'other' means registered somewhere, 'missing' means registered
 * nowhere, and only the second stops the build.
 *
 * (An element referenced by two projects of one model is fine. The model is the
 * build unit; it compiles once either way. Projects are editing views, and the
 * one you are working in has to contain the object you are changing.)
 *
 * `inlineWriteVerification` looked at the active project as well, and compared
 * a resolved absolute path against the include:
 *
 *   path.resolve(projectDir, include) === path.resolve(filePath)
 *
 * Includes are neither project-dir-relative nor extension-bearing — the writer
 * emits `AxEnum\Name` (see projectFile.ts) against a file at
 * `<packages>\<pkg>\<model>\AxEnum\Name.xml`. The two can never be equal, so
 * every write reported "the .rnrproj does NOT reference this file". Twelve of
 * those in one run taught the agent to disregard the warning, and it then
 * disregarded the one that was true.
 *
 * Hence one implementation, comparing include-to-include, over every project of
 * the model, with a definite answer for "registered, but somewhere else".
 */
export type MembershipStatus = 
/** Referenced by the project we are writing into. */
'active'
/** Referenced by another project of the same model — registered, not missing. */
 | 'other'
/** Referenced by no project of this model. This one really does not compile. */
 | 'missing'
/** No project could be read; say nothing rather than guess. */
 | 'unknown';
export interface Membership {
    status: MembershipStatus;
    /** Projects that reference the object, active one first. Paths, as found. */
    owners: string[];
}
export declare function axFolderForObjectType(objectType: string): string;
/** AOT folder name (any case) → object type. Used to read objects back out of a project. */
export declare function objectTypeForAxFolder(axFolder: string): string | undefined;
/**
 * The `Content Include` a given object has in a .rnrproj: AOT folder, backslash,
 * object name, no extension. Lowercased — VS is case-insensitive here and the
 * generators are not consistent about it ("…CtsoFinExtension" on disk against
 * "…CtsoFINExtension" in the XML, say), which is not a reason to report a miss.
 */
export declare function includeKey(axFolder: string, objectName: string): string;
/**
 * A project path as a human names it: leaf, no extension.
 *
 * Splits on both separators instead of path.basename, which on a POSIX host
 * treats the backslashes of a Windows project path as ordinary characters and
 * hands the whole path back — so "registered in <project>" would print an
 * absolute path where a name belongs.
 */
export declare function projectDisplayName(projectPath: string): string;
/**
 * Every `Content Include` in a .rnrproj, lowercased. Throws only if the file
 * cannot be read or parsed; callers treat that as `unknown`, never as `missing`.
 */
export declare function readProjectIncludes(projectPath: string): Promise<Set<string>>;
/**
 * Which projects of this model reference the object.
 *
 * `activeProjectPath` is checked first and reported first; `siblingProjectPaths`
 * are the other .rnrproj of the SAME model — pass them and a file registered in
 * its owning project stops looking missing. Pass none and this degrades to the
 * old active-project-only answer, which is still correct, just less useful.
 */
export declare function resolveMembership(axFolder: string, objectName: string, activeProjectPath: string | undefined, siblingProjectPaths?: readonly string[]): Promise<Membership>;
/**
 * The one line a write response spends on project membership, or '' when there
 * is nothing worth saying. Silence is the common case: the file is registered
 * where it should be and the caller does not need to be told so again.
 *
 * 'other' used to read "that is where this object belongs; do not add it again
 * here". That was the wrong rule: an element may be referenced by several
 * .rnrproj of one model, it still compiles once, and an object being changed in
 * the active project has to be IN the active project to be built or handed over
 * from it. So the line now names the gap instead of blessing it — and normally
 * never fires on a write at all, because registerFileInActiveProject has just
 * closed it. It survives for writes made with addToProject off.
 */
export declare function renderMembership(m: Membership, axFolder: string, objectName: string): string;
//# sourceMappingURL=projectMembership.d.ts.map