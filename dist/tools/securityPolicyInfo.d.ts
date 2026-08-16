/**
 * Get Security Policy Info Tool
 * Reads an AxSecurityPolicy (row-level / OLS) from the SQLite index: the primary
 * (constrained) table, the policy query, the operation it covers, and whether
 * the primary table itself is constrained. Azure-safe READ tool.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function getSecurityPolicyInfoTool(request: CallToolRequest, context: XppServerContext): Promise<{
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
//# sourceMappingURL=securityPolicyInfo.d.ts.map