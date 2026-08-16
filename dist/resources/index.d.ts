/**
 * Unified MCP Resource registrar.
 *
 * The MCP SDK keeps ONE handler per request schema — a second
 * server.setRequestHandler(ListResourcesRequestSchema, …) call would silently
 * overwrite the first. This module is the single dispatcher for ListResources /
 * ListResourceTemplates / ReadResource, routing by URI scheme so class and
 * workspace resources can coexist.
 *
 * Resources exposed:
 *   • xpp://class/{className}     — class source (resource template)
 *   • workspace://context        — curated context snapshot (JSON)
 *   • workspace://stats          — symbol-index + workspace statistics (JSON)
 *   • workspace://files          — list of X++ files in the workspace (JSON)
 *   • workspace://recent-changes — uncommitted X++ changes vs HEAD (JSON)
 */
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';
import type { XppServerContext } from '../types/context.js';
export declare function registerResources(server: Server, context: XppServerContext): void;
//# sourceMappingURL=index.d.ts.map