/**
 * Normalise whatever the user pasted into the MCP endpoint.
 *
 * People copy the site root from the Azure portal far more often than the
 * endpoint, so accept both and append the path when it is missing rather than
 * failing a form validation on it.
 */
export declare function normalizeServerUrl(input: string): {
    url: string;
    health: string;
} | null;
interface MergeOutcome {
    json: string;
    replaced: boolean;
    siblings: string[];
}
/**
 * Merge the entry into an existing config. Returns null when the file exists
 * but cannot be parsed — overwriting it would destroy the user's other servers,
 * so the caller stops and asks them to fix it by hand.
 */
export declare function mergeConfig(existing: string | null, key: 'servers' | 'mcpServers', name: string, entry: Record<string, unknown>): MergeOutcome | null;
export interface ConnectOptions {
    client?: string;
    apiKey?: string;
    yes?: boolean;
    /** Write even when the server cannot be reached (deployed but currently down). */
    force?: boolean;
}
export declare function connectCommand(urlArg: string | undefined, opts: ConnectOptions): Promise<void>;
export {};
//# sourceMappingURL=connect.d.ts.map