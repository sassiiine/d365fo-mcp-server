/**
 * Table Extension Info Tool
 * Retrieve all extensions for a D365FO table, with effective schema merging.
 *
 * Data sources (in priority order):
 *  1. extension_metadata table in SQLite — rich data (fields, methods, CoC, events)
 *  2. symbols table — lightweight fallback when extension_metadata is empty
 *  3. Filesystem scan of AxTableExtension XML files — final fallback for custom models
 *     that haven't been re-indexed yet. Eliminates the need for the AI to run PowerShell.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function tableExtensionInfoTool(request: CallToolRequest, context: XppServerContext): Promise<import("../../bridge/bridgeAdapter.js").ToolResult | {
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
export declare const formExtensionInfoTool: (request: CallToolRequest, context: XppServerContext) => Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    isError?: undefined;
    content: {
        type: string;
        text: string;
    }[];
}>;
export declare const enumExtensionInfoTool: (request: CallToolRequest, context: XppServerContext) => Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    isError?: undefined;
    content: {
        type: string;
        text: string;
    }[];
}>;
export declare const edtExtensionInfoTool: (request: CallToolRequest, context: XppServerContext) => Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    isError?: undefined;
    content: {
        type: string;
        text: string;
    }[];
}>;
export declare const dataEntityExtensionInfoTool: (request: CallToolRequest, context: XppServerContext) => Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    isError?: undefined;
    content: {
        type: string;
        text: string;
    }[];
}>;
export declare const classExtensionInfoTool: (request: CallToolRequest, context: XppServerContext) => Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    isError?: undefined;
    content: {
        type: string;
        text: string;
    }[];
}>;
//# sourceMappingURL=tableExtensionInfo.d.ts.map