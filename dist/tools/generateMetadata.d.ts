/**
 * generateMetadata.ts
 *
 * Regenerates D365FO runtime metadata manifests (.md files) from XML source
 * after an xppc compile, without requiring a full VS build.
 *
 * Background: xppc.exe compiles X++ source into .netmodule files but does NOT
 * update the binary .md manifests that the AOS uses to resolve class names at
 * runtime. VS BuildTask does this as a post-compile step using the
 * MetadataProviderFactory + RuntimeMetadataWriter APIs from
 * Microsoft.Dynamics.AX.Metadata.Storage.dll.
 *
 * This module replicates that step by:
 *  1. Compiling a small .NET Framework 4.x helper (GenerateMetadata.exe) on
 *     first use, referencing the DLLs from the D365FO framework directory.
 *  2. Running the compiled helper after each successful xppc build.
 *
 * The helper exe is cached in the framework `bin` directory (so .NET resolves
 * the referenced Dynamics DLLs via the application base) under a name that
 * embeds a short hash of its C# source. It therefore survives MCP server
 * restarts and is recompiled automatically both when D365FO is upgraded (new
 * framework directory) and when the helper source below changes (new hash).
 */
export interface GenerateMetadataResult {
    skipped: boolean;
    success: boolean;
    message: string;
}
/**
 * Regenerate the .md runtime metadata manifests for `modelName` from its XML
 * source. Called after a successful xppc build.
 *
 * @param microsoftPackagesPath  Framework directory (FrameworkDirectory / PackagesLocalDirectory for CHE)
 * @param customPackagesPath     Model store root — the directory that contains the model folder
 * @param modelName              Model to regenerate manifests for
 */
export declare function generateRuntimeMetadata(microsoftPackagesPath: string, customPackagesPath: string, modelName: string): Promise<GenerateMetadataResult>;
//# sourceMappingURL=generateMetadata.d.ts.map