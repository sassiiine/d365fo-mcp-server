/**
 * Workspace Scanner
 * Scans local X++ files in workspace for hybrid analysis
 */
export interface WorkspaceFile {
    path: string;
    name: string;
    type: 'class' | 'table' | 'form' | 'enum' | 'unknown';
    content?: string;
    lastModified: Date;
    metadata?: ParsedMetadata;
}
export interface ParsedMetadata {
    methods?: MethodMetadata[];
    fields?: FieldMetadata[];
    extends?: string;
    implements?: string[];
    properties?: Record<string, any>;
}
export interface MethodMetadata {
    name: string;
    params?: string;
    returnType?: string;
    signature: string;
    isStatic?: boolean;
}
export interface FieldMetadata {
    name: string;
    type?: string;
    edt?: string;
    mandatory?: boolean;
}
export declare class WorkspaceScanner {
    private workspaceCache;
    /** Cache TTL; paired with invalidate() (called after writes) to keep results current without an fs.watch. Lazy expiry — no background timer. */
    private static readonly CACHE_TTL_MS;
    /**
     * Scan workspace for X++ files
     */
    scanWorkspace(workspacePath: string): Promise<WorkspaceFile[]>;
    /**
     * Drop cached scan results so the next scanWorkspace re-reads from disk.
     * Call after a write (create/modify/undo) so "recently edited" and the
     * active-file resolution reflect the change immediately.
     */
    invalidate(workspacePath?: string): void;
    /**
     * Read content of specific file
     */
    readFile(filePath: string): Promise<string>;
    /**
     * Search X++ symbols in workspace files
     */
    searchInWorkspace(workspacePath: string, query: string, type?: 'class' | 'table' | 'form' | 'enum'): Promise<WorkspaceFile[]>;
    /**
     * Detect file type from path
     */
    private detectFileType;
    /**
     * Get statistics about workspace
     */
    getWorkspaceStats(workspacePath: string): Promise<{
        totalFiles: number;
        classes: number;
        tables: number;
        forms: number;
        enums: number;
    }>;
    /**
     * Parse XML metadata from file
     */
    parseXmlFile(filePath: string): Promise<ParsedMetadata | undefined>;
    /**
     * Parse AxClass XML structure
     */
    private parseClassXml;
    /**
     * Parse AxTable XML structure
     */
    private parseTableXml;
    /**
     * Get file with parsed metadata
     */
    getFileWithMetadata(filePath: string): Promise<WorkspaceFile | null>;
    /**
     * Clear cache (alias of invalidate() with no argument).
     */
    clearCache(): void;
}
//# sourceMappingURL=workspaceScanner.d.ts.map