/**
 * Hybrid Search
 * Combines external D365FO metadata index with local workspace files
 */
import type { XppSymbolIndex } from '../metadata/symbolIndex.js';
import type { WorkspaceScanner, WorkspaceFile } from './workspaceScanner.js';
import type { XppSymbol } from '../metadata/types.js';
export interface HybridSearchResult {
    source: 'external' | 'workspace';
    symbol?: XppSymbol;
    file?: WorkspaceFile;
    relevance: number;
}
export declare class HybridSearch {
    private symbolIndex;
    private workspaceScanner;
    constructor(symbolIndex: XppSymbolIndex, workspaceScanner: WorkspaceScanner);
    /**
     * Search in both external metadata and workspace
     */
    search(query: string, options?: {
        types?: Array<'class' | 'table' | 'form' | 'method' | 'field' | 'enum' | 'query' | 'view'>;
        limit?: number;
        workspacePath?: string;
        includeWorkspace?: boolean;
    }): Promise<HybridSearchResult[]>;
    /**
     * Search patterns in workspace code
     */
    searchPatterns(scenario: string, workspacePath: string): Promise<{
        externalPatterns: any[];
        workspaceMatches: WorkspaceFile[];
    }>;
    /**
     * Calculate relevance score
     */
    private calculateRelevance;
}
//# sourceMappingURL=hybridSearch.d.ts.map