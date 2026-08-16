/**
 * Singleton that stores information captured from the stdio MCP handshake.
 *
 * Written by:
 *  - index.ts createInitializeParamsSniffer() — parses the raw `initialize`
 *    JSON-RPC request (first message on stdin) and stores clientInfo + capabilities.
 *  - mcpServer.ts applyRootsToConfig() — stores last roots/list result.
 *  - mcpServer.ts RootsListChangedNotificationSchema handler — increments
 *    rootsListChangedCount each time VS 2022 reports a workspace change.
 *
 * Read by get_workspace_info so devs can verify what VS 2022 is sending
 * without having to grep log files.
 */
const _info = {
    clientName: null,
    clientVersion: null,
    protocolVersion: null,
    supportsRootsListChanged: false,
    initializedAt: null,
    lastRoots: [],
    rootsLastAt: null,
    rootsListChangedCount: 0,
    rootsListChangedLastAt: null,
};
/** Returns a live reference — callers should treat it as read-only. */
export function getStdioSessionInfo() {
    return _info;
}
/** Called once when the raw `initialize` request is parsed from stdin. */
export function setInitializeParams(params) {
    _info.protocolVersion = params.protocolVersion ?? null;
    _info.clientName = params.clientInfo?.name ?? null;
    _info.clientVersion = params.clientInfo?.version ?? null;
    _info.supportsRootsListChanged = params.capabilities?.roots?.listChanged === true;
    _info.initializedAt = new Date().toISOString();
}
/** Called by applyRootsToConfig after each roots/list fetch. */
export function setLastRoots(uris) {
    _info.lastRoots = uris;
    _info.rootsLastAt = new Date().toISOString();
}
/** Called by the RootsListChangedNotificationSchema handler. */
export function recordRootsListChanged() {
    _info.rootsListChangedCount++;
    _info.rootsListChangedLastAt = new Date().toISOString();
}
//# sourceMappingURL=stdioSessionInfo.js.map