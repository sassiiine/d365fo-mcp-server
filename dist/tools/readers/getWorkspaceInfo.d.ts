/**
 * get_workspace_info — the workspace/config/index diagnostic.
 *
 * This was ~320 lines living INSIDE the dispatcher's switch statement, which
 * made toolHandler.ts both the router and the largest single tool
 * implementation in the codebase. Every other tool is a function in its own
 * file; this one now is too, and its dispatcher case is one line like the rest.
 *
 * Behaviour is unchanged — this is a move.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function getWorkspaceInfoTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
//# sourceMappingURL=getWorkspaceInfo.d.ts.map