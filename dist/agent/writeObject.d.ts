export interface WriteRequest {
    objectType: string;
    objectName: string;
    modelName: string;
    xmlContent: string;
    /** Packages root; defaults to D365FO_PACKAGE_PATH. */
    packagePath?: string;
    /** .rnrproj to register the file in. Optional - the build works at model level. */
    projectPath?: string;
    overwrite?: boolean;
}
export interface WriteResult {
    path: string;
    bytes: number;
    addedToProject: boolean;
    warnings: string[];
}
/**
 * D365FO metadata convention: CRLF line endings, no BOM, no trailing newline.
 *
 * Copied rather than imported from utils/d365XmlNormalizer so the agent bundle
 * does not reach back into the server tree. It is four lines, and the coupling
 * would cost more than the duplication - if it ever grows, share it deliberately.
 */
export declare function normalizeMetadataXml(content: string): string;
/** Absolute path an object of this type/name/model belongs at. */
export declare function resolveObjectPath(req: Pick<WriteRequest, 'objectType' | 'objectName' | 'modelName' | 'packagePath'>): string;
export declare function writeObject(req: WriteRequest): Promise<WriteResult>;
//# sourceMappingURL=writeObject.d.ts.map