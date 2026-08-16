/**
 * security_info Tool — unified security-lookup entry point.
 *
 * Replaces two security tools with one discriminated by `mode`:
 *   • artifact → details + full hierarchy of a privilege/duty/role
 *                (Role → Duties → Privileges → Entry Points)
 *   • coverage → reverse chain: which roles/duties/privileges cover an object
 *
 * Handler files stay where they are — only the MCP surface is consolidated.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare const SECURITY_MODES: readonly ['artifact', 'coverage'];
export type SecurityMode = (typeof SECURITY_MODES)[number];
export declare function securityInfoTool(request: CallToolRequest, context: XppServerContext): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: boolean;
}>;
//# sourceMappingURL=securityInfo.d.ts.map