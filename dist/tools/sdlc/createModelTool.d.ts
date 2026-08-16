/**
 * `create_d365fo_model` handler for the full server.
 *
 * Thin wrapper over src/agent/createModel.ts so the full server and the thin
 * agent create models identically - two implementations of a descriptor would
 * drift, and a model that differs by layer or module references fails in ways
 * that point at the objects inside it rather than at the model.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function createModelToolHandler(request: CallToolRequest, _context: XppServerContext): Promise<{
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
//# sourceMappingURL=createModelTool.d.ts.map