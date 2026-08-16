/**
 * Shared object-reader dispatch registry.
 *
 * Maps an objectType discriminator → the underlying get_*_info handler, its tool
 * name, and an args builder. Single source of truth for get_object_info, in both
 * its single-object form ({objectType, name} with type-specific options
 * passthrough) and its plural form ({objects:[…]} fanned out in parallel).
 *
 * The handler functions live in their own files and stay there — consolidating
 * the MCP *surface* into get_object_info does not delete the handlers.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export type InfoTool = (request: CallToolRequest, context: XppServerContext) => Promise<any>;
/**
 * Append actionable "use search / update_symbol_index, don't grep the disk" guidance
 * to a reader result that failed to resolve the object. Applied on every
 * get_object_info lookup (single or plural) so every reader benefits from a
 * single choke point.
 *
 * No-op unless the result is an error whose text reads like a not-found (so genuine
 * operation errors aren't masked), and skipped when a type-mismatch hint or our own
 * guidance is already present (keeps it idempotent and avoids double guidance).
 */
export declare function withNotFoundGuidance(result: any, name: string, objectType: string): any;
export interface ReaderDispatch {
    tool: InfoTool;
    toolName: string;
    /** Build the underlying handler args from the object name + optional type-specific options. */
    buildArgs: (name: string, options?: Record<string, unknown>) => Record<string, unknown>;
}
export declare const READER_DISPATCH: Record<string, ReaderDispatch>;
/** Homogeneous "object by name → structure" types exposed by get_object_info. */
export declare const OBJECT_INFO_TYPES: readonly ['class', 'table', 'form', 'query', 'view', 'enum', 'edt', 'report', 'data-entity', 'menu-item', 'service', 'map', 'config-key', 'security-policy', 'macro', 'table-extension', 'class-extension', 'form-extension', 'enum-extension', 'edt-extension', 'data-entity-extension'];
//# sourceMappingURL=objectInfoRegistry.d.ts.map