/**
 * Get Object Info Tool — unified single-object metadata reader.
 *
 * Replaces the per-type get_*_info tools (get_class_info, get_table_info, …,
 * get_service_info, get_macro_info) with one tool discriminated by `objectType`.
 * Dispatches to the existing handler for that type via the shared READER_DISPATCH
 * registry; type-specific knobs go in `options` and are passed through.
 *
 * Always available across server modes: bridge-backed types (class/table/…)
 * work on the local VM, SQLite-backed types (service/map/config-key/…) work on
 * Azure read-only. When the backing source is absent the underlying handler
 * returns a clear "not found / needs index / needs VM" message.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function getObjectInfoTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
//# sourceMappingURL=getObjectInfo.d.ts.map