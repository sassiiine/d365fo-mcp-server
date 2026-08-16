/**
 * Security Artifact Info Tool
 * Retrieve full details for security privileges, duties, and roles including hierarchy chains
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function securityArtifactInfoTool(request: CallToolRequest, context: XppServerContext): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: boolean;
}>;
//# sourceMappingURL=securityArtifactInfo.d.ts.map