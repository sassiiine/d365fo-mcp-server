/**
 * Custom HTTP Transport for MCP over Azure Web Service.
 * Uses direct JSON responses (not SSE streaming) for Azure orchestrator compatibility.
 */
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import type { JSONRPCMessage } from '@modelcontextprotocol/sdk/types.js';
import type { Express } from 'express';
import type { XppServerContext } from '../types/context.js';
export declare class CustomHttpTransport implements Transport {
    private server;
    private app;
    private context;
    private pendingRequests;
    onmessage?: (message: JSONRPCMessage) => void;
    onerror?: (error: Error) => void;
    onclose?: () => void;
    constructor(server: Server, app: Express, context: XppServerContext);
    /**
     * Connects MCP server to this transport
     * CRITICAL: Must be called for proper protocol lifecycle and completion signaling
     */
    connectServer(): Promise<void>;
    start(): Promise<void>;
    close(): Promise<void>;
    send(message: JSONRPCMessage): Promise<void>;
    private setupRoutes;
}
export declare function createStreamableHttpTransport(server: Server, app: Express, context: XppServerContext): CustomHttpTransport;
//# sourceMappingURL=transport.d.ts.map