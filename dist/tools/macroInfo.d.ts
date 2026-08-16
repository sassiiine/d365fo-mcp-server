/**
 * Get Macro Info Tool
 * Reads an AxMacroDictionary (shared macro library) from the SQLite index and
 * lists its #define entries. Resolves the #define values that X++ code references
 * via #<Library>.<Name>, so the model does not have to open the macro XML.
 * Azure-safe READ tool.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function getMacroInfoTool(request: CallToolRequest, context: XppServerContext): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
}>;
//# sourceMappingURL=macroInfo.d.ts.map