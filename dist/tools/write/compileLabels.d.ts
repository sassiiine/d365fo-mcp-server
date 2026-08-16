/**
 * compileLabels.ts
 *
 * Compiles a model's label files into resource assemblies with labelc.exe.
 *
 * A label written through `labels(action="create")` lands as a line in
 * `<model>\AxLabelFile\LabelResources\<lang>\<file>.<lang>.label.txt`. Nothing
 * reads that text file at compile time: the compiler and the best-practice
 * checker resolve `@Model:Id` against the compiled resource assembly at
 * `<model>\Resources\<model>.dll`, which only labelc.exe produces.
 *
 * This server never ran labelc, so on a model whose labels had only ever been
 * created through the MCP tools the `Resources` folder did not exist at all —
 * every reference to a freshly created label was reported as an unknown label.
 * Observed 2026-07-29 in the Contoso eval sandbox: two `BPErrorUnknownLabel`
 * plus five `BPUnusedStrFmtArgument` cascading from them, all six of which
 * vanished after a manual labelc run with no source change whatsoever. That
 * makes it the worst kind of diagnostic — it points at correct code, and the
 * only way to clear it is a step the tool never mentions.
 *
 * VS runs label compilation BEFORE the X++ compile, and so must this: labelc
 * after xppc would leave the current build reporting the stale errors and only
 * clear them on the next one.
 */
export interface CompileLabelsResult {
    /** True when labelc was not run at all (nothing to do, or it could not be found). */
    skipped: boolean;
    /** False only when a run was attempted and failed. */
    success: boolean;
    message: string;
}
/**
 * Every `AxLabelFile` directory in a model package.
 *
 * A package folder contains one folder per model it holds, and the label files
 * sit one level below that — `Contoso\Contoso\AxLabelFile`. The inner name is
 * the MODEL name, which need not equal the package name, so the layout is
 * discovered rather than assumed.
 */
export declare function findLabelFileDirs(packageDir: string): Promise<string[]>;
/**
 * Whether the compiled assemblies no longer describe the label sources.
 *
 * Missing output counts as stale, so the case this defect was found in — a
 * model that never had a `Resources` folder — always compiles. Errs toward
 * recompiling: labelc costs about a second, while skipping a needed run
 * reinstates the bogus unknown-label errors this module exists to prevent.
 */
export declare function labelAssembliesAreStale(labelDirs: string[], resourcesDir: string, moduleName: string): Promise<boolean>;
/** Arguments VS passes, plus explicit toolchain directories when we found them. */
export declare function labelcArgs(customPackagesPath: string, modelName: string, resourcesDir: string, cscDir: string | null, sdkToolsDir: string | null): string[];
/**
 * Compile `modelName`'s labels into `<model>\Resources`. Called before xppc so
 * the compile and BP check that follow can resolve the labels.
 *
 * @param microsoftPackagesPath Framework directory holding `bin\labelc.exe`.
 * @param customPackagesPath    Model store root — the folder containing the model folder.
 * @param modelName             Package/module to compile labels for.
 * @param force                 Recompile even when the assemblies look current (full builds).
 */
export declare function compileModelLabels(microsoftPackagesPath: string, customPackagesPath: string, modelName: string, force?: boolean): Promise<CompileLabelsResult>;
//# sourceMappingURL=compileLabels.d.ts.map