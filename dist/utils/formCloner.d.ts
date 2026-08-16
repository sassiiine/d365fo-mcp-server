/**
 * Form Cloner — clones an existing AxForm XML into a new form, re-binding
 * datasources/fields to target tables.
 *
 * All transformations are STRING-LEVEL on the original XML text — never
 * parse/re-serialize. D365FO metadata XML is whitespace-, CDATA- and
 * namespace-marker-sensitive (tabs, CRLF, xmlns="", i:nil), and a round-trip
 * through an XML library corrupts it. Regions we don't touch stay byte-identical.
 */
export interface CloneFormOptions {
    /** Name of the new form (already prefixed) */
    targetFormName: string;
    /** sourceTable → targetTable re-binding (omit to keep the source tables) */
    tableMapping?: Record<string, string>;
    /**
     * Field lookup for a target table (case-insensitive names). Return null when
     * the table is unknown — fields then pass through unfiltered.
     */
    getTableFields?: (table: string) => string[] | null;
    /** Strip form/datasource methods except classDeclaration (default true) */
    stripMethods?: boolean;
    /** New Design caption (label ref or text). Replaces the source form's caption. */
    caption?: string;
}
export interface CloneFormResult {
    xml: string;
    sourceFormName: string;
    renamedDataSources: Array<{
        from: string;
        to: string;
    }>;
    droppedFields: Array<{
        dataSource: string;
        field: string;
    }>;
    removedControls: string[];
    strippedMethods: string[];
    /** True when the <SourceCode> datasource/control method mirror was emptied. */
    clearedSourceCodeMirror: boolean;
    /** True when the classDeclaration body (member vars/macros) was reset to empty. */
    resetClassDeclaration: boolean;
    /** Default datasource indexes dropped from re-bound datasources. */
    removedIndexes: Array<{
        dataSource: string;
        index: string;
    }>;
    /** QuickFilter defaultColumnName references repointed/cleared after column removal. */
    repointedQuickFilters: Array<{
        from: string;
        to: string;
    }>;
    /**
     * Per-datasource field-retention stats for re-bound datasources whose target
     * table fields were known. Lets callers detect a poor structural match (the
     * reference form's table is unrelated to the target → most fields dropped).
     */
    fieldStats: Array<{
        dataSource: string;
        total: number;
        dropped: number;
    }>;
}
interface ElementBlock {
    start: number;
    end: number;
    content: string;
}
/**
 * Find all top-level blocks of `tagName` inside `xml` using balanced
 * open/close counting (handles nested same-name elements, e.g. AxFormControl
 * inside AxFormControl, AxFormDataSource inside DerivedDataSources).
 * Self-closing tags (<Tag ... />) count as complete blocks.
 */
export declare function findElementBlocks(xml: string, tagName: string, searchStart?: number, searchEnd?: number): ElementBlock[];
export declare function cloneFormXml(sourceXml: string, opt: CloneFormOptions): CloneFormResult;
export {};
//# sourceMappingURL=formCloner.d.ts.map