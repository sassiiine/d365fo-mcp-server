/**
 * MCP Server Configuration and Setup
 * Registers tools, resources, and prompts for X++ code completion
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { XppServerContext } from '../types/context.js';
export type { XppServerContext };
export { SERVER_MODE, LOCAL_TOOLS, WRITE_TOOLS, TOOL_PROFILE, CORE_TOOLS } from './serverMode.js';
export type { ServerMode, ToolProfile } from './serverMode.js';
export declare function createXppMcpServer(context: XppServerContext): Server;
//# sourceMappingURL=mcpServer.d.ts.map