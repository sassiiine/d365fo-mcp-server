/**
 * Get Table Patterns Tool
 * Analyzes common field types, index patterns, and relation structures
 * Used for smart table generation
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export interface FieldPattern {
    name: string;
    edt: string;
    frequency: number;
    mandatoryCount: number;
}
export interface IndexPattern {
    fields: string[];
    unique: boolean;
    frequency: number;
}
export interface RelationPattern {
    targetTable: string;
    frequency: number;
    constraints: Array<{
        field: string;
        relatedField: string;
    }>;
}
export declare function handleGetTablePatterns(args: {
    tableGroup?: string;
    similarTo?: string;
    limit?: number;
}, symbolIndex: any): Promise<any>;
export declare function getTablePatternsTool(request: CallToolRequest, context: XppServerContext): Promise<{
    isError?: undefined;
    content: {
        type: string;
        text: string;
    }[];
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=getTablePatterns.d.ts.map