/** Set DEBUG_LOGGING=true to enable verbose logging via debugLog. */
const DEBUG_LOGGING = process.env.DEBUG_LOGGING === 'true';
export function debugLog(...args) {
    if (DEBUG_LOGGING) {
        console.error(...args);
    }
}
//# sourceMappingURL=logger.js.map