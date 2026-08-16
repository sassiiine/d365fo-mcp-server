/**
 * X++ Symbol Search Tool
 * Search for classes, tables, methods, and fields by name or keyword
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
import { type ISearchIndex } from '../../metadata/searchBackend.js';
/**
 * Index-safe probe for symbols whose name EQUALS the query (#15).
 *
 * Runs `lookupSymbolsNocase`, i.e. an exact-case equality probe on
 * idx_name_type followed by a bounded FTS5 phrase match for differently-cased
 * input. Deliberately NOT `LIKE` and NOT `name = ? COLLATE NOCASE` as the
 * primary predicate: on the 1.17M-row production symbol DB either shape
 * degrades to a full scan (80–278 s measured) and blocks the event loop until
 * MCP clients kill the server.
 *
 * Returns [] on any failure — the exact-first repair must never break search.
 */
export declare function probeExactMatches(index: ISearchIndex, query: string, types?: string[]): Promise<Array<{
    name: string;
    type: string;
    model?: string;
    filePath?: string;
}>>;
/**
 * Probe the SQLite index for keyword matches that live in CUSTOM/ISV models.
 *
 * Broad keyword searches routed through the C# bridge fill their fixed result
 * window in provider-enumeration order (Microsoft-dominated) and truncate at
 * `maxResults`, so custom matches enumerated later never reach the client — the
 * search then looks like it "returns only Microsoft objects". These hits are
 * spliced back into the bridge/external results and ranked directly after exact
 * matches so custom code is always visible. Model-scoped and FTS-driven, so it
 * stays index-safe (never a full `%query%` scan of the whole corpus).
 *
 * Returns [] on any failure — the custom-first repair must never break search.
 */
export declare function probeCustomMatches(index: ISearchIndex, query: string, types?: string[], limit?: number): Promise<Array<{
    name: string;
    type: string;
    model?: string;
    filePath?: string;
}>>;
export declare function searchTool(request: CallToolRequest, context: XppServerContext): Promise<import("../../bridge/bridgeAdapter.js").ToolResult | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    isError?: undefined;
    content: {
        type: string;
        text: string;
    }[];
}>;
//# sourceMappingURL=search.d.ts.map