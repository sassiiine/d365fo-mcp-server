/**
 * MCP tool annotations — display titles + behavior hints for every tool.
 *
 * Applied to the ListTools response in mcpServer.ts. Clients use these for UX:
 *  - `title`           → VS Code chat shows "Ran Search D365FO index" instead of
 *                        "Ran search"
 *  - `readOnlyHint`    → read-only tools skip the write-confirmation dialog,
 *                        speeding up agentic flows
 *  - `destructiveHint` → tools that overwrite/rewrite existing content get an
 *                        explicit confirmation
 *  - `idempotentHint`  → repeated identical calls are safe (build, sync, index)
 *  - `openWorldHint`   → false everywhere: this server only touches the local
 *                        D365FO metadata store and symbol index, never the
 *                        open internet
 *
 * Per MCP spec these are HINTS for display/UX, not security boundaries.
 * Every tool in src/server/toolSchemas/index.ts MUST have an entry here —
 * enforced by tests/utils/toolInventory.test.ts, which iterates that array.
 * (This map's size is also what src/index.ts derives the runtime tool count
 * from, so a missing entry undercounts the startup log as well.)
 */
export interface ToolAnnotations {
    title: string;
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
}
export declare const TOOL_ANNOTATIONS: Record<string, ToolAnnotations>;
//# sourceMappingURL=toolAnnotations.d.ts.map