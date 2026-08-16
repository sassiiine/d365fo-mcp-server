/**
 * Raw AOT XML for an object, by name.
 *
 * The readers render metadata; they never show the file. Callers that want the
 * actual XML — to copy a convention, to see element order, to check what a
 * previous write produced — had no tool for it and went to the shell:
 * `Get-ChildItem -Recurse` to find the path, then `Get-Content -Raw` to read
 * it. A recursive scan of PackagesLocalDirectory costs seconds; this is one
 * indexed lookup.
 */
export interface ObjectXmlOptions {
    modelName?: string;
    /** 1-based, inclusive. Omit both for the whole file (up to maxChars). */
    startLine?: number;
    endLine?: number;
    maxChars?: number;
}
export interface ObjectXmlResult {
    text: string;
    isError: boolean;
}
/** Render a file already located. Split out so it is testable without config. */
export declare function renderObjectXml(filePath: string, objectType: string, objectName: string, options?: ObjectXmlOptions): Promise<ObjectXmlResult>;
/** The message for an object with no file — never an empty result. */
export declare function objectXmlNotFound(objectType: string, objectName: string, modelName?: string): ObjectXmlResult;
export declare function readObjectXml(objectType: string, objectName: string, options?: ObjectXmlOptions): Promise<ObjectXmlResult>;
//# sourceMappingURL=objectXml.d.ts.map