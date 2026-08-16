/**
 * Search Suggestion Engine
 * Provides intelligent suggestions for failed or empty search results
 */
import type { XppSymbol } from '../metadata/types.js';
export interface SearchSuggestion {
    type: 'typo' | 'broader' | 'narrower' | 'related';
    query: string;
    reason: string;
    confidence: number;
}
/**
 * Generate suggestions for a failed search query
 */
export declare function generateSearchSuggestions(query: string, allSymbolNames: string[], symbolsByTerm: Map<string, XppSymbol[]>, maxSuggestions?: number): SearchSuggestion[];
/**
 * Format suggestions for display
 */
export declare function formatSuggestions(suggestions: SearchSuggestion[]): string;
//# sourceMappingURL=suggestionEngine.d.ts.map