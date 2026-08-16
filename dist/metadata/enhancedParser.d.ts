/**
 * Enhanced X++ Metadata Parser
 * Extension of xmlParser.ts with richer metadata extraction for better Copilot integration
 */
import type { XppClassInfo, XppMethodInfo } from './types.js';
/**
 * Enhanced method information with additional context
 */
export interface EnhancedMethodInfo extends XppMethodInfo {
    sourceSnippet?: string;
    complexity?: number;
    usedTypes?: string[];
    methodCalls?: string[];
    tags?: string[];
    inlineComments?: string;
}
/**
 * Enhanced class information
 */
export declare class EnhancedXppParser {
    constructor();
    /**
     * Extract semantic tags from method name and source code
     */
    extractSemanticTags(source: string, className: string, methodName: string): string[];
    /**
     * Calculate complexity score for a method
     */
    calculateComplexity(source: string): number;
    /**
     * Extract types (classes/tables) used in the source code
     */
    extractUsedTypes(source: string): string[];
    /**
     * Extract method calls from source code
     */
    extractMethodCalls(source: string): string[];
    /**
     * Extract inline comments from source code
     */
    extractInlineComments(source: string): string;
    /**
     * Get first N lines of code
     */
    getFirstLines(source: string, lineCount?: number): string;
    /**
     * Parse method with enhanced metadata
     */
    parseMethodEnhanced(method: XppMethodInfo, parentClass: string): EnhancedMethodInfo;
    /**
     * Create usage pattern examples from method source
     */
    generateUsageExample(className: string, method: EnhancedMethodInfo): string | undefined;
    /**
     * Extract all classes/tables used by a class
     */
    extractClassDependencies(classInfo: XppClassInfo): string[];
    /**
     * Generate comprehensive tags for a class
     */
    generateClassTags(classInfo: XppClassInfo): string[];
    /**
     * Detect pattern type for a class
     */
    detectClassPatternType(className: string, methods: XppMethodInfo[]): string;
    /**
     * Generate typical usage patterns from method source
     */
    generateTypicalUsages(className: string, methods: XppMethodInfo[]): string[];
    /**
     * Generate example value based on type
     */
    private generateExampleValue;
    /**
     * Analyze method relationships and generate related methods list
     */
    generateRelatedMethods(method: XppMethodInfo, allMethods: XppMethodInfo[]): string[];
    /**
     * Build API patterns from method source code
     */
    buildApiPatterns(_className: string, method: XppMethodInfo): any;
}
//# sourceMappingURL=enhancedParser.d.ts.map