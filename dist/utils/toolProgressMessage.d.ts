/**
 * Builds a human-readable progress/status description for a given tool call.
 * Used in two places:
 *   - stdio mode  → sent as MCP notifications/message BEFORE the tool runs (visible in chat)
 *   - HTTP mode   → prepended to the tool result text (visible when expanding the tool call)
 */
export declare function buildProgressMessage(toolName: string, args: Record<string, any> | undefined): string;
//# sourceMappingURL=toolProgressMessage.d.ts.map