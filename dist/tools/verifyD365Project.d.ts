/**
 * D365FO Project Verification Tool
 * Checks whether D365FO objects exist on disk and are referenced in the VS project file.
 * Use this instead of PowerShell to verify that create_d365fo_file placed files correctly.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function verifyD365ProjectTool(request: CallToolRequest, _context: XppServerContext): Promise<{
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
//# sourceMappingURL=verifyD365Project.d.ts.map