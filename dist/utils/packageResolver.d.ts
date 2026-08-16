/**
 * Package Resolver
 * Maps model names to package names using descriptor XML files
 * and filesystem scanning.
 *
 * In D365FO, the metadata directory structure is:
 *   {Root}/{PackageName}/{ModelName}/AxClass/...
 *   {Root}/{PackageName}/Descriptor/{ModelName}.xml
 *
 * The descriptor XML contains <ModelModule> (package name) and <Name> (model name).
 * A single package (e.g., "CustomExtensions") can contain many models
 * (e.g., "Contoso Utilities", "Contoso Reporting").
 *
 * This resolver builds a map from model name -> package info by:
 * 1. Reading descriptor XML files (primary strategy)
 * 2. Falling back to filesystem scanning for directories with AOT-type folders
 */
export interface ResolvedPackage {
    packageName: string;
    modelName: string;
    rootPath: string;
}
export declare class PackageResolver {
    private roots;
    private modelToPackageMap;
    /** Lowercase lookup mirror of modelToPackageMap for case-insensitive resolve(). */
    private lowercaseLookup;
    private buildPromise;
    constructor(roots: string[]);
    /**
     * Resolve a model name to its package name.
     * Returns null if the model cannot be found in any root.
     */
    resolve(modelName: string): Promise<ResolvedPackage | null>;
    /**
     * Resolve with an explicit package name (bypasses lookup).
     */
    resolveWithPackage(modelName: string, packageName: string): ResolvedPackage;
    /**
     * Get all known model-to-package mappings.
     */
    getAllMappings(): Promise<Map<string, ResolvedPackage>>;
    /**
     * Invalidate the cache to force a rescan.
     */
    clearCache(): void;
    private ensureBuilt;
    private buildMap;
    private static readonly AOT_FOLDERS;
    private hasAotTypeFolder;
}
//# sourceMappingURL=packageResolver.d.ts.map