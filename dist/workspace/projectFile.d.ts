/**
 * Reading and writing the Visual Studio .rnrproj project file.
 *
 * ProjectFileFinder locates the project a model belongs to; ProjectFileManager
 * adds and removes the <Content Include> entries an AOT object needs to compile.
 *
 * Both lived in the CREATE tool, and six other modules imported them from there
 * — including the modify tool, which closed a direct createD365File <-> modify
 * cycle between the two largest files in the codebase. Neither class is about
 * creating an object; they are about the project file, which is workspace
 * state, so they live here.
 */
/**
 * Register a file that is already on disk into the ACTIVE project, whenever the
 * active project is not already listing it.
 *
 * An object may legitimately be referenced by several .rnrproj of one model. A
 * project is an editing view over a model, not an ownership claim: the model is
 * the build unit, each element compiles once per model however many projects
 * name it, and teams routinely group one element into a feature project and a
 * maintenance project both. So "some other project has it" is not a reason to
 * leave it out of the one being worked in — you cannot build, check in, or hand
 * over a change through a project that does not contain the object it changed.
 *
 * Both halves of that are measured, not assumed (#882):
 *  • Compiler — xppc.exe takes `-modelmodule=<model>` and writes one assembly per
 *    module. There is no project-level input at all, so a .rnrproj cannot cause a
 *    second compilation. (X++ Compiler 7.0.7996.33.)
 *  • Visual Studio / ALM — surveyed a real 187-project ISV solution authored in VS
 *    over years: 280 of its 1899 AOT elements are listed in two or more projects of
 *    the SAME model, across 20 element types (92 AxClass, plus forms, tables,
 *    form/table extensions, security duties, EDTs…). Shared membership is routine
 *    practice in a shipping codebase, not an edge case, and that solution's own
 *    build projects list no elements whatsoever — they declare `<Model>` and let
 *    the build task compile the module, which is the packaging flow agreeing with
 *    the compiler.
 *
 * This used to stop at membership 'other' and report the sibling as the owner.
 * That inverted the rule: an object edited in the active project stayed absent
 * from it, and every later verify pass had to re-explain why the gap was fine.
 * The only case that still writes nothing is 'active' — it is already there.
 *
 * Shared by create and modify, which need it for the same reason: an object
 * that existed but was unregistered could never BECOME registered — create
 * bailed before its addToProject block, and modify's flag defaulted off against
 * a wire schema telling the caller to keep the default.
 *
 * Returns the line to append to the tool's response, or '' when there is
 * nothing worth saying. Never throws: the write it comments on has already
 * succeeded, and an unreadable project must not turn that into a failure.
 */
export declare function registerFileInActiveProject(objectType: string, objectName: string, modelName: string | undefined, projectPath: string | undefined): Promise<string>;
/**
 * Project File Finder
 * Finds .rnrproj files in solution directory or specific paths
 */
export declare class ProjectFileFinder {
    /**
     * Find .rnrproj file in solution directory
     * Recursively searches for .rnrproj files matching the model name (up to 3 levels deep)
     */
    static findProjectInSolution(solutionPath: string, modelName: string): Promise<string | null>;
    private static findRecursive;
}
/**
 * Visual Studio Project (.rnrproj) Manipulator
 */
export declare class ProjectFileManager {
    private parser;
    private builder;
    constructor();
    /**
     * Get friendly display folder name for project (used in Folder Include and Link)
     * e.g. class → Classes, enum → Base Enums
     */
    private getFolderName;
    /**
     * Get AOT folder prefix for Content Include path (no .xml extension)
     * e.g. class → AxClass, enum → AxEnum, data-entity → AxDataEntityView
     */
    private getAxFolderPrefix;
    /**
     * Add file reference to Visual Studio project
     * D365FO projects use ABSOLUTE paths to XML files in PackagesLocalDirectory
     * Returns true if file was added, false if file already exists in project
     */
    addToProject(projectPath: string, objectType: string, objectName: string, _absoluteXmlPath: string): Promise<boolean>;
    private _addToProjectLocked;
    /**
     * Reverse of {@link addToProject}: remove the <Content Include> entry that
     * addToProject wrote for `objectName`, and drop the <Folder Include> it added when
     * no other Content of the same AOT type remains. A folder entry that was already in
     * the project is left alone. Used by undo_last_modification to clean the .rnrproj
     * after deleting a file it created in a non-git sandbox.
     * Returns true when an entry was removed, false when nothing matched.
     */
    removeFromProject(projectPath: string, objectType: string, objectName: string): Promise<boolean>;
    private _removeFromProjectLocked;
    /**
     * Add label file entries to Visual Studio project.
     * Each language needs TWO entries:
     *   1. AxLabelFile descriptor:   Include="AxLabelFile\{id}_{lang}"  Link="Label Files\{id}_{lang}"
     *   2. LabelResources .label.txt: Include="{id}.{lang}.label.txt"  DependentUpon="AxLabelFile\{id}_{lang}"
     * Both are added inside a single file-lock + parse/write cycle for efficiency.
     * Returns the list of descriptor names that were newly added.
     */
    addLabelToProject(projectPath: string, labelFileId: string, languages: string[]): Promise<string[]>;
    private _addLabelToProjectLocked;
    /**
     * Extract ModelName from Visual Studio project file
     * Returns the actual model name from PropertyGroup/Model or PropertyGroup/ModelName
     */
    extractModelName(projectPath: string): Promise<string | null>;
}
//# sourceMappingURL=projectFile.d.ts.map