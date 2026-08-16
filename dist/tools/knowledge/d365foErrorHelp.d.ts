/**
 * D365FO Error Help Tool
 * Diagnose X++ compilation errors, BP warnings, and runtime exceptions.
 * Returns a plain-language explanation and corrective action — no DB access needed.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
/**
 * Programmatic lookup against ERROR_DB — used by build_d365fo_project to
 * enrich structured compiler diagnostics with a fix hint without an extra
 * tool round-trip. Returns the best match or undefined.
 */
export declare function lookupErrorFix(errorText: string): {
    title: string;
    fix: string[];
} | undefined;
export declare function d365foErrorHelpTool(request: CallToolRequest): {
    isError?: undefined;
    content: {
        type: 'text';
        text: string;
    }[];
} | {
    content: {
        type: 'text';
        text: string;
    }[];
    isError: boolean;
};
//# sourceMappingURL=d365foErrorHelp.d.ts.map