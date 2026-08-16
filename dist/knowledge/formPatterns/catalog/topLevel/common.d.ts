/**
 * Shared NodeSpec fragments reused across top-level form pattern specs.
 */
import type { NodeSpec, Occurrence } from '../../types.js';
/** Standard form-level ActionPane (always the first control under Design) */
export declare function actionPane(occurrence?: Occurrence): NodeSpec;
/** Custom filter group (QuickFilter + custom filters) above a grid */
export declare function filterGroup(occurrence?: Occurrence): NodeSpec;
/** Main tabular grid */
export declare function mainGrid(occurrence?: Occurrence): NodeSpec;
//# sourceMappingURL=common.d.ts.map