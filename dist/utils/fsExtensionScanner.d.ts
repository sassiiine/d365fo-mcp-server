/**
 * Filesystem Extension Scanner
 *
 * Generic utility for scanning Ax*Extension XML files on disk.
 * Used as a last-resort fallback when the SQLite index has no data for a given
 * base object — prevents the AI from falling back to PowerShell scripts.
 *
 * Supported extension types and their AOT folders:
 *
 *   Standard (ObjectName.ModelName.xml):
 *     table-extension          → AxTableExtension
 *     form-extension           → AxFormExtension
 *     enum-extension           → AxEnumExtension
 *     edt-extension            → AxEdtExtension
 *     view-extension           → AxViewExtension
 *     query-extension          → AxQuerySimpleExtension
 *     data-entity-extension    → AxDataEntityViewExtension
 *     map-extension            → AxMapExtension
 *     menu-extension           → AxMenuExtension
 *     security-duty-extension  → AxSecurityDutyExtension
 *     security-role-extension  → AxSecurityRoleExtension
 *     menu-item-display-extension → AxMenuItemDisplayExtension
 *     menu-item-action-extension  → AxMenuItemActionExtension
 *     menu-item-output-extension  → AxMenuItemOutputExtension
 *
 *   Class-style (ObjectName_Extension.xml in AxClass/):
 *     class-extension          → AxClass  (filename ends with _Extension)
 */
export interface FsExtensionScanResult {
    /** Extension object name (from <Name> element) */
    name: string;
    /** Model directory name (immediate child of package dir) */
    model: string;
    /** Absolute path to the XML file */
    filePath: string;
    /** Field names added by this extension (table / view / data-entity extensions) */
    addedFields: string[];
    /** Index names added by this extension (table extensions) */
    addedIndexes: string[];
    /** Names of methods defined in this extension */
    addedMethods: string[];
    /** Methods that contain the `next` keyword — Chain of Command wrappers */
    cocMethods: string[];
    /** Enum value names added by this extension (enum extensions) */
    addedValues: string[];
    /** Controls added via form extension */
    addedControls: string[];
    /** Data sources added via form extension */
    addedDataSources: string[];
}
interface ExtensionTypeConfig {
    axFolder: string;
    /**
     * When true the extension lives in AxClass/, named like
     * `BaseName_Extension.xml` or `BaseName_ModelExtension.xml`.
     * When false the extension file is named `BaseName.Model.xml`.
     */
    isClassStyle?: boolean;
}
export declare const EXTENSION_FOLDER_CONFIG: Readonly<Record<string, ExtensionTypeConfig>>;
/**
 * Scan the D365FO packages directory for extension XML files for a given base
 * object and extension type.
 *
 * Protections against request-time pathology:
 *  - returns [] immediately when D365FO_DISABLE_FS_FALLBACK=true
 *  - caps total work at SCAN_TIMEOUT_MS (partial results allowed)
 *  - caches the result for SCAN_CACHE_TTL_MS
 *
 * @param objectName   Base object name (e.g. `SalesTable`, `SalesOrder`)
 * @param extensionType Key from EXTENSION_FOLDER_CONFIG (e.g. `'table-extension'`)
 * @param packagePath  Root packages directory (e.g. `K:\AOSService\PackagesLocalDirectory`)
 */
export declare function scanFsExtensions(objectName: string, extensionType: string, packagePath: string): Promise<FsExtensionScanResult[]>;
export {};
//# sourceMappingURL=fsExtensionScanner.d.ts.map