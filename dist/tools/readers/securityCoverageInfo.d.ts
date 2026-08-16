/**
 * Security Coverage Info Tool
 * Show what security objects (privileges/duties/roles) cover a given D365FO object
 * by tracing the reverse chain: object → menu items → privileges → duties → roles
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function securityCoverageInfoTool(request: CallToolRequest, context: XppServerContext): Promise<{
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
//# sourceMappingURL=securityCoverageInfo.d.ts.map