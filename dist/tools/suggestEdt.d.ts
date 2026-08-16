/**
 * Suggest EDT Tool
 * Intelligent EDT suggestion based on field name fuzzy matching
 */
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { XppSymbolIndex } from '../metadata/symbolIndex.js';
interface SuggestEdtArgs {
    fieldName: string;
    context?: string;
    limit?: number;
}
export declare const suggestEdtTool: Tool;
export declare function handleSuggestEdt(args: SuggestEdtArgs, symbolIndex: XppSymbolIndex): Promise<any>;
export {};
//# sourceMappingURL=suggestEdt.d.ts.map