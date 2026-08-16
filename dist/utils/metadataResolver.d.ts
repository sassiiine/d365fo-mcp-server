/**
 * Metadata Resolver
 *
 * Resolves D365FO object metadata from the local extracted-metadata/ folder.
 * The SQLite DB stores file_path values that point to the Azure DevOps build-agent
 * (e.g. C:\home\vsts\work\1\...) which is never accessible at runtime.
 * Instead, this module reads the pre-extracted JSON/XML from extracted-metadata/.
 *
 * Folder layout:
 *   extracted-metadata/{ModelName}/classes/{ClassName}.json   → { name, model, methods[], ... }
 *   extracted-metadata/{ModelName}/enums/{EnumName}.json      → { raw: "<xml>..." }
 *   extracted-metadata/{ModelName}/tables/{TableName}.json    → { name, model, fields[], ... }
 */
export type ExtractedObjectType = 'classes' | 'enums' | 'edts' | 'tables' | 'views';
export interface ExtractedViewField {
    name: string;
    dataSource?: string;
    dataField?: string;
    dataMethod?: string;
    labelId?: string;
    isComputed: boolean;
}
export interface ExtractedViewRelationField {
    field: string;
    relatedField: string;
}
export interface ExtractedViewRelation {
    name: string;
    relatedTable: string;
    relationType: string;
    cardinality: string;
    fields?: ExtractedViewRelationField[];
}
export interface ExtractedViewMetadata {
    name: string;
    model: string;
    sourcePath: string;
    type: 'view' | 'data-entity';
    label?: string;
    isPublic?: boolean;
    isReadOnly?: boolean;
    primaryKey?: string;
    primaryKeyFields?: string[];
    fields: ExtractedViewField[];
    relations: ExtractedViewRelation[];
    methods: Array<{
        name: string;
    } | string>;
}
/**
 * Read the raw XML string from an extracted-metadata enum JSON file.
 * Returns null if not available.
 */
export declare function readEnumRawXml(model: string, enumName: string): Promise<string | null>;
/**
 * Read the raw XML string from an extracted-metadata EDT JSON file.
 * Returns null if not available.
 */
export declare function readEdtRawXml(model: string, edtName: string): Promise<string | null>;
export declare function readViewMetadata(model: string, viewName: string): Promise<ExtractedViewMetadata | null>;
/**
 * Attempt to remap a build-agent file path to the locally configured packages path.
 *
 * The SQLite index stores paths from the Azure DevOps CI build agent, e.g.:
 *   Linux:   /home/vsts/work/1/PackagesLocalDirectory/applicationsuite/Foundation/AxForm/CustTable.xml
 *   Windows: C:\home\vsts\work\1\PackagesLocalDirectory\applicationsuite\Foundation\AxForm\CustTable.xml
 *
 * This extracts the relative part after "PackagesLocalDirectory" and joins it with
 * the locally configured packagePath, so tools can read the XML from a local D365FO
 * installation even though the DB path itself points to a non-existent CI machine.
 *
 * Returns null when the path cannot be remapped or the remapped file does not exist.
 */
export declare function resolveDbPathLocally(dbFilePath: string): Promise<string | null>;
/**
 * Query the symbol index DB to find what top-level types a given name exists as.
 * Ignores 'method' and 'field' rows — those are children, not top-level objects.
 *
 * @param db - SQLite Database instance (symbolIndex.db)
 * @param name - the object name to look up
 */
export declare function detectObjectTypeInDb(db: any, name: string): Array<{
    type: string;
    model: string;
}>;
/**
 * Build a Markdown warning section when an object was looked up as one type
 * (e.g. 'class') but actually exists in the DB as a different type (form, table …).
 *
 * Returns an empty string when no mismatch is detected.
 *
 * @param db           - SQLite Database instance
 * @param name         - the object name that was not found
 * @param expectedType - the type that was searched for (default: 'class')
 */
export declare function buildObjectTypeMismatchMessage(db: any, name: string, expectedType?: string): string;
/**
 * Heuristic: does a reader result's text indicate an object-resolution ("not found")
 * failure, as opposed to a genuine operation error (parse failure, timeout, etc.)?
 * Used to decide whether to append the not-found guidance below.
 */
export declare function isNotFoundResultText(text: string | undefined): boolean;
/**
 * Actionable guidance appended to a reader's "object not found" result.
 *
 * Steers the agent to the right MCP tools (search / update_symbol_index) and away
 * from filesystem scanning (Get-ChildItem / Select-String / dir / ls / find), which
 * is slow across 350+ model folders and can hang the VS 2022 MCP integration.
 */
export declare function buildNotFoundGuidance(name: string, objectType: string): string;
/**
 * Build a friendly error explaining that the XML for this object type
 * is not available in the current deployment (no D365FO installation).
 */
export declare function buildXmlNotAvailableMessage(objectType: string, objectName: string, dbFilePath: string): string;
//# sourceMappingURL=metadataResolver.d.ts.map