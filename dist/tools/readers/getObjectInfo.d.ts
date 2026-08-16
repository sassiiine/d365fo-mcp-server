/**
 * Get Object Info Tool — unified object metadata reader, single or plural.
 *
 * Replaces the per-type get_*_info tools (get_class_info, get_table_info, …,
 * get_service_info, get_macro_info) with one tool discriminated by `objectType`,
 * and absorbs the former `batch_get_info` as its plural `objects[]` form so the
 * batched path is the DEFAULT path instead of a separate tool the model has to
 * discover (issue #831 — 13 sequential lookups in one session, zero batch calls).
 * Dispatches to the existing handler for that type via the shared READER_DISPATCH
 * registry; type-specific knobs go in `options` and are passed through.
 *
 * Always available across server modes: bridge-backed types (class/table/…)
 * work on the local VM, SQLite-backed types (service/map/config-key/…) work on
 * Azure read-only. When the backing source is absent the underlying handler
 * returns a clear "not found / needs index / needs VM" message.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function getObjectInfoTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
//# sourceMappingURL=getObjectInfo.d.ts.map