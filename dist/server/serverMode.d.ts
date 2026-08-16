/**
 * Server mode + tool profile configuration.
 *
 * Two independent axes decide which tools this MCP server instance publishes:
 *
 *  1. LOCALITY (MCP_SERVER_MODE=full|read-only|write-only) — which half of the
 *     toolset this process can physically serve, enabling a hybrid deployment
 *     where an Azure-hosted instance runs 'read-only' (search / analysis) and a
 *     local Windows VM instance runs 'write-only' (file operations).
 *
 *  2. BREADTH (MCP_TOOL_PROFILE=full|core) — how much of the toolset is worth
 *     advertising at all. Hosts stop sending the tool catalogue inline past a
 *     limit (VS Code: ~100 tools across all servers) and switch the model to a
 *     search-based tool surface, which costs a discovery round trip per tool it
 *     needs (issue #825). 'core' publishes only the plan → discover → write →
 *     build → verify loop; MCP_EXTRA_TOOLS adds individual tools back.
 *
 * isToolEnabled() is the single predicate combining both, shared by the
 * ListTools filter and the runtime call gate so they cannot drift apart.
 */
/**
 * Tools that need local Windows VM filesystem access (K:\ drive) or local server
 * state not reachable from Azure. Excluded in 'read-only' mode; the only tools
 * exposed in 'write-only' (local companion) mode. These skip the dbReady await
 * since they don't need the symbol database.
 *
 * Also includes the bridge-backed read surface (get_method) which works via
 * IMetadataProvider without SQLite, so Copilot can verify objects it just
 * created without an Azure re-deploy.
 */
export declare const LOCAL_TOOLS: Set<string>;
/**
 * Tools exposed in EVERY server mode, bypassing the LOCAL_TOOLS partition,
 * because each spans both localities and gates unavailable actions at runtime:
 *  - get_object_info: dispatches to bridge-backed types (local VM) and
 *    SQLite-backed types (Azure read-only).
 *  - labels: read actions (search/info) work on Azure; write actions
 *    (create/rename) need K:\ and error clearly when unreachable.
 *  - d365fo_file: generate works on Azure; create/modify need K:\ and error
 *    clearly when unreachable.
 */
export declare const ALWAYS_TOOLS: Set<string>;
/**
 * @deprecated Use LOCAL_TOOLS — kept temporarily so any external import doesn't break.
 * Will be removed in the next major release.
 */
export declare const WRITE_TOOLS: Set<string>;
/**
 * Server mode, resolved once at startup from MCP_SERVER_MODE env var.
 * - 'full'       (default) – all tools registered (local development)
 * - 'read-only'  – LOCAL_TOOLS excluded   (Azure App Service deployment)
 * - 'write-only' – only LOCAL_TOOLS exposed (lightweight local companion)
 */
export type ServerMode = 'full' | 'read-only' | 'write-only';
export declare const SERVER_MODE: ServerMode;
/**
 * Single source of truth for whether a tool is callable in a given server mode.
 * Used by BOTH the ListTools filter (mcpServer) and the runtime call gate
 * (toolHandler) so the advertised tool list and call-time enforcement can
 * never drift apart. ALWAYS_TOOLS bypass the LOCAL_TOOLS partition in every mode.
 */
export declare function isToolAllowedInMode(mode: ServerMode, toolName: string): boolean;
/**
 * The tools a full "understand it, write it, build it, verify it" D365FO
 * workflow actually walks through. Membership is positive and explicit so a new
 * tool has to be argued INTO the small profile rather than drifting in
 * (tests/utils/toolInventory.test.ts fails until every published tool is
 * classified).
 *
 * Excluded from 'core' — each is a specialist detour off the write loop, and
 * each stays one MCP_EXTRA_TOOLS entry (or MCP_TOOL_PROFILE=full) away:
 *  - extension_info  → extension-point analysis; search + get_object_info +
 *                      object_patterns carry the write path.
 *  - analyze_code    → code-quality/pattern review, not a step in creating code.
 *  - validate_code   → advisory X++ lint; run_bp_check and the compiler are the
 *                      authoritative gates and both stay in core.
 *  - security_info   → security-model inspection, its own kind of task.
 *  - run_systest_class → test execution, a separate phase (and gated behind an
 *                      interactive console on most boxes).
 *
 * generate_object and trigger_db_sync are kept IN core against the raw
 * never-called list from the audit: scaffolding is load-bearing for the create
 * path, and a table change is not finished until the DB is synchronised.
 */
export declare const CORE_TOOLS: Set<string>;
/**
 * Tool profile, resolved once at startup from MCP_TOOL_PROFILE.
 * - 'full' (default) – every tool this mode allows; nobody's setup changes
 * - 'core'           – CORE_TOOLS (+ MCP_EXTRA_TOOLS) only
 */
export type ToolProfile = 'full' | 'core';
export declare const TOOL_PROFILE: ToolProfile;
/** Parse a comma/space separated tool list (MCP_EXTRA_TOOLS) into a set. */
export declare function parseToolList(raw: string | undefined): Set<string>;
/** Non-core tools added back on top of the 'core' profile. Ignored when full. */
export declare const EXTRA_TOOLS: ReadonlySet<string>;
/** Whether a tool survives the breadth filter. 'full' keeps everything. */
export declare function isToolInProfile(profile: ToolProfile, toolName: string, extras?: ReadonlySet<string>): boolean;
/**
 * Single source of truth for whether a tool is published AND callable: locality
 * first, then breadth. Used by the ListTools filter (mcpServer) and the runtime
 * call gate (toolHandler).
 */
export declare function isToolEnabled(toolName: string, mode?: ServerMode, profile?: ToolProfile, extras?: ReadonlySet<string>): boolean;
//# sourceMappingURL=serverMode.d.ts.map