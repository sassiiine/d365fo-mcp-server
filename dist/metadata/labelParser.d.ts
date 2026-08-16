/**
 * AxLabelFile Parser
 * Parses D365FO .label.txt files from PackagesLocalDirectory
 * and indexes them into the SQLite labels table.
 *
 * Label file format (one per line):
 *   LabelId=Label text
 *    ;Optional comment line (leading space + semicolon)
 *
 * File locations on K: drive:
 *   {pkg}\{Model}\{Model}\AxLabelFile\LabelResources\{locale}\{LabelFileId}.{locale}.label.txt
 *   {pkg}\{Model}\{Model}\AxLabelFile\{LabelFileId}_{locale}.xml  (metadata descriptor)
 */
import type { XppSymbolIndex } from './symbolIndex.js';
export interface ParsedLabel {
    labelId: string;
    text: string;
    comment?: string;
    labelFileId: string;
    model: string;
    language: string;
    filePath: string;
}
/**
 * True when a label file ID refers to a label file EXTENSION rather than an
 * original (base) label file owned by the model.
 *
 * D365FO names label file extensions with an `_Extension` marker, optionally
 * followed by a model prefix — e.g. `Base_Extension` or `Base_ExtensionContoso`.
 * On disk the content file is `${labelFileId}.${locale}.label.txt`, so the
 * `_Extension` marker is carried in the label file ID itself.
 *
 * New labels must always be created in the model's own ORIGINAL label file.
 * An extension only extends a base label file owned by another model; adding
 * brand-new labels there is almost always a mistake (and is what leads clients
 * to wrongly prefix the label IDs).
 */
export declare function isExtensionLabelFile(labelFileId: string): boolean;
/**
 * Parse a single .label.txt file into ParsedLabel records.
 */
export declare function parseLabelFile(content: string, labelFileId: string, model: string, language: string, filePath: string): ParsedLabel[];
/**
 * Discover all AxLabelFile resources for a model.
 * Returns an array of { labelFileId, language, filePath }.
 */
export declare function discoverLabelFiles(modelDir: string): Promise<Array<{
    labelFileId: string;
    language: string;
    filePath: string;
}>>;
/**
 * Index ALL labels from PackagesLocalDirectory into the symbol index.
 * Scans all model folders.
 */
export declare function indexAllLabels(symbolIndex: XppSymbolIndex, packagesPath: string, modelFilter?: (modelName: string) => boolean, opts?: {
    ftsStrategy?: 'rebuild' | 'incremental';
    skipFtsRebuild?: boolean;
}): Promise<{
    totalLabels: number;
    modelsIndexed: number;
    ftsRebuildPending: boolean;
}>;
//# sourceMappingURL=labelParser.d.ts.map