/**
 * Hybrid Search
 * Combines external D365FO metadata index with local workspace files
 */
import { levenshteinDistance } from '../utils/fuzzyMatching.js';
export class HybridSearch {
    symbolIndex;
    workspaceScanner;
    constructor(symbolIndex, workspaceScanner) {
        this.symbolIndex = symbolIndex;
        this.workspaceScanner = workspaceScanner;
    }
    /**
     * Search in both external metadata and workspace
     */
    async search(query, options = {}) {
        const results = [];
        // External metadata (D365FO PackagesLocalDirectory).
        // NOT yet routed through the ISearchIndex seam (metadata/searchBackend.ts):
        // HybridSearch also calls analyzeCodePatterns (local-only), so it moves to
        // the cloud backend together with that enrichment in the follow-up port.
        const externalSymbols = this.symbolIndex.searchSymbols(query, options.limit || 20, options.types);
        for (const symbol of externalSymbols) {
            results.push({
                source: 'external',
                symbol,
                relevance: this.calculateRelevance(query, symbol.name),
            });
        }
        // Workspace files, if a workspace path was provided
        if (options.includeWorkspace && options.workspacePath) {
            const workspaceFiles = await this.workspaceScanner.searchInWorkspace(options.workspacePath, query, options.types?.[0] // Use first type for workspace filter
            );
            for (const file of workspaceFiles) {
                results.push({
                    source: 'workspace',
                    file,
                    relevance: this.calculateRelevance(query, file.name),
                });
            }
        }
        results.sort((a, b) => b.relevance - a.relevance);
        // Deduplicate by name, preferring workspace over external.
        const seen = new Set();
        const deduplicated = [];
        for (const result of results) {
            const name = result.symbol?.name || result.file?.name;
            if (!name)
                continue;
            if (!seen.has(name)) {
                seen.add(name);
                deduplicated.push(result);
            }
            else if (result.source === 'workspace') {
                const idx = deduplicated.findIndex((r) => (r.symbol?.name || r.file?.name) === name);
                if (idx !== -1) {
                    deduplicated[idx] = result;
                }
            }
        }
        return deduplicated.slice(0, options.limit || 20);
    }
    /**
     * Search patterns in workspace code
     */
    async searchPatterns(scenario, workspacePath) {
        // Get patterns from external metadata
        const externalPatterns = this.symbolIndex.analyzeCodePatterns(scenario);
        // Search workspace for matching files
        const workspaceMatches = await this.workspaceScanner.searchInWorkspace(workspacePath, scenario);
        return {
            externalPatterns,
            workspaceMatches,
        };
    }
    /**
     * Calculate relevance score
     */
    calculateRelevance(query, name) {
        const q = query.toLowerCase();
        const n = name.toLowerCase();
        // Exact match = 100
        if (n === q)
            return 100;
        // Starts with = 80
        if (n.startsWith(q))
            return 80;
        // Contains = 50
        if (n.includes(q))
            return 50;
        // Fuzzy match: scale continuously by similarity instead of a flat 30
        const distance = levenshteinDistance(q, n);
        const similarity = 1 - distance / Math.max(q.length, n.length);
        if (similarity >= 0.65)
            return Math.round(20 + similarity * 30); // 40–50 range
        return 10;
    }
}
//# sourceMappingURL=hybridSearch.js.map