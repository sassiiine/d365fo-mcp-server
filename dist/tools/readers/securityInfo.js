/**
 * security_info Tool — unified security-lookup entry point.
 *
 * Replaces two security tools with one discriminated by `mode`:
 *   • artifact → details + full hierarchy of a privilege/duty/role
 *                (Role → Duties → Privileges → Entry Points)
 *   • coverage → reverse chain: which roles/duties/privileges cover an object
 *
 * Handler files stay where they are — only the MCP surface is consolidated.
 */
import { securityArtifactInfoTool } from './securityArtifactInfo.js';
import { securityCoverageInfoTool } from './securityCoverageInfo.js';
export const SECURITY_MODES = ['artifact', 'coverage'];
function subRequest(name, args) {
    return { method: 'tools/call', params: { name, arguments: args } };
}
function err(text) {
    return { content: [{ type: 'text', text }], isError: true };
}
export async function securityInfoTool(request, context) {
    const a = (request.params.arguments ?? {});
    const mode = a.mode;
    const { mode: _mode, ...rest } = a;
    switch (mode) {
        case 'artifact':
            // Validate per-mode required params here so the agent gets a guided
            // message instead of the underlying handler's raw ZodError.
            if (!a.name)
                return err('security_info(mode="artifact") requires `name` (the privilege/duty/role name).');
            if (!a.artifactType)
                return err('security_info(mode="artifact") requires `artifactType` (privilege, duty, or role).');
            return securityArtifactInfoTool(subRequest('get_security_artifact_info', rest), context);
        case 'coverage':
            if (!a.objectName)
                return err('security_info(mode="coverage") requires `objectName` (the form/table/class/menu-item name).');
            return securityCoverageInfoTool(subRequest('get_security_coverage_for_object', rest), context);
        default:
            return err(`security_info: unknown mode "${mode ?? '(missing)'}". Use one of: ${SECURITY_MODES.join(', ')}.`);
    }
}
// Tool registration (name, description, inputSchema) lives in
// src/server/toolSchemas/securityInfo.ts — the single source of truth for tool
// instructions. It is NOT in mcpServer.ts; that file only spreads the
// aggregated toolSchemas array into the ListTools response.
//# sourceMappingURL=securityInfo.js.map