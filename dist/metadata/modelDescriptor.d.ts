/**
 * Model descriptor reader — `<PackagesLocalDirectory>/<Package>/Descriptor/<Model>.xml`.
 *
 * `<ModuleReferences>` is the only statement of what a model may see: xppc
 * resolves types against the referenced packages, not against everything
 * installed, so an indexed type can still be invisible to the model being
 * compiled. The visible set is the model's own package plus its DIRECT
 * references — walking the closure would mark such a type visible again and
 * hide the defect this exists to catch.
 *
 * Not a compiler: a table in a referenced package can still need a further
 * reference because a third package contributes a table extension to it.
 *
 * build_d365fo_project reads the same element to order its build queue and
 * calls straight into `parseModuleReferences`.
 */
/**
 * Extract every `<d2p1:string>` entry of a descriptor's `<ModuleReferences>`.
 * The sibling `<ModelReferences>` is `i:nil` in every descriptor observed on a
 * real box, so the flat scan cannot pick up entries from it.
 */
export declare function parseModuleReferences(descriptorXml: string): string[];
/**
 * Read a model's direct module references, or null when it has no readable
 * descriptor — which callers must treat as unknown, never as "references nothing".
 */
export declare function readModuleReferences(packagesPath: string, modelName: string): Promise<string[] | null>;
/** The PackagesLocalDirectory root contained in a package or workspace path. */
export declare function packagesRootFromPath(candidate: string | undefined | null): string | null;
export interface ModelVisibility {
    /** Target model, for diagnostics. */
    model: string;
    /** PackagesLocalDirectory root the indexed file paths are relative to. */
    packagesRoot: string;
    /** Lower-cased package folder names the model may reference (incl. its own). */
    visiblePackages: ReadonlySet<string>;
    /**
     * Package folder owning an indexed file, or null when the path is not under
     * this packages root. Null means "cannot tell" and must silence the check.
     */
    packageOf(filePath: string): string | null;
}
/**
 * Build (and memoise) the visibility oracle for `modelName`; null whenever the
 * answer would be a guess. Callers must then skip the check — a missing
 * descriptor turning into a wall of errors is worse than the gap it closes.
 */
export declare function getModelVisibility(packagesRoot: string | null | undefined, modelName: string | null | undefined): ModelVisibility | null;
/** Uncached form — exported for tests, which need a fresh fixture each time. */
export declare function buildModelVisibility(packagesRoot: string | null | undefined, modelName: string | null | undefined): ModelVisibility | null;
//# sourceMappingURL=modelDescriptor.d.ts.map