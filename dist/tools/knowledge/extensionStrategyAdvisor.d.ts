/**
 * Extension Strategy Advisor Tool
 * Recommends the correct D365FO extensibility mechanism for a given scenario,
 * preventing common mistakes like using CoC where a Business Event is needed.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function extensionStrategyAdvisorTool(request: CallToolRequest, _context: XppServerContext): Promise<{
    content: {
        type: 'text';
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=extensionStrategyAdvisor.d.ts.map