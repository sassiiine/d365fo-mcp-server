export interface CreateModelRequest {
    modelName: string;
    /** Metadata repo root (contains Metadata\ and Projects\). Omit for in-place. */
    repoRoot?: string;
    /** PackagesLocalDirectory; defaults to D365FO_PACKAGE_PATH. */
    packagesPath?: string;
    description?: string;
    publisher?: string;
    /** AOT layer. 14 (USR) is customer code; Microsoft ships at 0. */
    layer?: number;
    /** Modules the model may reference. Without these, standard EDTs do not resolve. */
    moduleReferences?: string[];
}
export interface CreateModelResult {
    modelName: string;
    modelId: number;
    metadataPath: string;
    projectPath: string;
    linkedFrom?: string;
    created: string[];
    warnings: string[];
}
/**
 * A stable model id derived from the name.
 *
 * Stable so re-running for the same name cannot collide with itself, and inside
 * the custom range so it cannot collide with a Microsoft model.
 */
export declare function modelIdFor(modelName: string): number;
export declare function buildDescriptorXml(req: Required<Pick<CreateModelRequest, 'modelName'>> & {
    modelId: number;
    description: string;
    publisher: string;
    layer: number;
    modules: string[];
}): string;
export declare function buildProjectXml(modelName: string, guid: string): string;
export declare function createModel(req: CreateModelRequest): Promise<CreateModelResult>;
//# sourceMappingURL=createModel.d.ts.map