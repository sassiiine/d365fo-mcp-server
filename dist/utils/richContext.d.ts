/**
 * Rich Context Utilities
 * Enhance tool responses with related suggestions, patterns, and tips
 */
import type { XppSymbol } from '../metadata/types.js';
export interface RichContextOptions {
    includeRelated?: boolean;
    includePatterns?: boolean;
    includeTips?: boolean;
    maxSuggestions?: number;
}
export interface RelatedSearch {
    query: string;
    reason: string;
}
export interface CommonPattern {
    pattern: string;
    frequency?: number;
}
export interface ContextualTip {
    tip: string;
    tool?: string;
}
export interface RichContext {
    relatedSearches?: RelatedSearch[];
    commonPatterns?: CommonPattern[];
    tips?: ContextualTip[];
}
/**
 * Generate related search suggestions based on query and results
 */
export declare function generateRelatedSearches(query: string, results: XppSymbol[], maxSuggestions?: number): RelatedSearch[];
/**
 * Detect common patterns in search results
 */
export declare function detectCommonPatterns(results: XppSymbol[]): CommonPattern[];
/**
 * Generate contextual tips based on query and results
 */
export declare function generateContextualTips(query: string, results: XppSymbol[], searchType?: string): ContextualTip[];
/**
 * Format rich context as markdown text
 */
export declare function formatRichContext(_query: string, results: XppSymbol[], richContext: RichContext, options?: RichContextOptions): string;
//# sourceMappingURL=richContext.d.ts.map