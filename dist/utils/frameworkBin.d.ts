/**
 * Locating an executable that ships in the D365FO framework `bin` directory
 * (xppc.exe, labelc.exe, …).
 *
 * The same three-step probe applies to every one of them: the configured
 * Microsoft packages path first, then any UDE install under %LOCALAPPDATA%
 * (newest version first), then whichever volume this image put AosService on.
 * It lived inline in buildProject.ts as `findXppcExe` until label compilation
 * needed the identical lookup for labelc.exe.
 */
/**
 * Absolute path to `exeName` in a D365FO framework bin directory, or null when
 * no probed location holds it.
 *
 * @param microsoftPackagesPath Configured framework directory, when known.
 * @param exeName               File name, e.g. `xppc.exe`.
 */
export declare function findFrameworkTool(microsoftPackagesPath: string | null, exeName: string): Promise<string | null>;
//# sourceMappingURL=frameworkBin.d.ts.map