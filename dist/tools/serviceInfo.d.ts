/**
 * Get Service Info Tool
 * Reads an AxService from the SQLite index: backing class, external name,
 * exposed operations, owning service group(s), and the computed REST endpoint
 * (/api/services/<ServiceGroup>/<Service>/<Operation>).
 *
 * Backed by the static symbol index (Azure-safe READ tool) — services are not
 * served by the C# bridge, so there is no bridge fast-path here.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function getServiceInfoTool(request: CallToolRequest, context: XppServerContext): Promise<{
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
//# sourceMappingURL=serviceInfo.d.ts.map