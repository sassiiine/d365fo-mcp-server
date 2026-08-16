/**
 * Workspace form patterns.
 * https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/user-interface/workspace-form-pattern
 *
 * Two flavors exist in metadata:
 *  - 'Workspace' — the original tabbed-panorama workspace (used by the local template)
 *  - 'WorkspaceOperational' — the preferred, performance-enhanced operational workspace
 * Exact xmlNames/versions are cross-checked by mining (Phase 3).
 */
import type { FormPatternSpec } from '../../types.js';
export declare const workspacePanorama: FormPatternSpec;
export declare const formPartSectionList: FormPatternSpec;
export declare const formPartSectionListDouble: FormPatternSpec;
export declare const hubPartChart: FormPatternSpec;
export declare const hubPartGrid: FormPatternSpec;
export declare const workspaceOperational: FormPatternSpec;
//# sourceMappingURL=workspace.d.ts.map