/**
 * Fuzzy Matching Utilities
 * Provides fuzzy string matching for typo detection and suggestions
 */
/**
 * Calculate Levenshtein distance between two strings
 * Used for detecting typos and similar terms
 */
export declare function levenshteinDistance(str1: string, str2: string): number;
/**
 * Find fuzzy matches for a query term within a list of candidates
 * Returns matches sorted by similarity score (best first)
 */
export interface FuzzyMatch {
    term: string;
    score: number;
    distance: number;
}
export declare function findFuzzyMatches(query: string, candidates: string[], minScore?: number, maxResults?: number): FuzzyMatch[];
/**
 * Check if query might be a typo based on common patterns
 */
export declare function isProbableTypo(query: string, bestMatch: string, score: number): boolean;
/**
 * Generate broader search suggestions by removing common suffixes
 */
export declare function generateBroaderSearches(query: string): string[];
/**
 * Generate narrower search suggestions by adding common suffixes
 */
export declare function generateNarrowerSearches(query: string): string[];
/**
 * Extract root term from a class name (remove common suffixes)
 */
export declare function extractRootTerm(term: string): string;
//# sourceMappingURL=fuzzyMatching.d.ts.map