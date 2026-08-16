/**
 * terminalUi — capability-aware console formatting for the dev/HTTP startup banner.
 *
 * Legacy Windows terminals (PowerShell 5.1/conhost) render UTF-8 emoji as
 * mojibake, so we detect Unicode-capable terminals and fall back to ASCII
 * glyphs ([OK]/[!]/-> instead of ✓/⚠/›) elsewhere. ANSI colour is likewise
 * disabled for pipes, NO_COLOR, and dumb terminals.
 */
/**
 * Whether the terminal reliably renders Unicode (box-drawing + emoji).
 * On Windows only modern hosts qualify. Honour FORCE_UNICODE=1/0 as an override.
 */
export declare const supportsUnicode: boolean;
export declare const c: {
    bold: (s: string) => string;
    dim: (s: string) => string;
    red: (s: string) => string;
    green: (s: string) => string;
    yellow: (s: string) => string;
    blue: (s: string) => string;
    magenta: (s: string) => string;
    cyan: (s: string) => string;
    gray: (s: string) => string;
};
export declare const glyph: {
    tl: string;
    tr: string;
    bl: string;
    br: string;
    h: string;
    v: string;
    dot: string;
    ok: string;
    warn: string;
    err: string;
    info: string;
    arrow: string;
    bullet: string;
    ellipsis: string;
};
/** Replace/strip emoji & fancy punctuation so legacy code pages don't show mojibake. No-op on Unicode terminals. */
export declare function sanitize(text: string): string;
/**
 * Draw a rounded box around the given rows. Each row is a pre-styled string;
 * width is derived from the widest visible row (min `minWidth`), capped sensibly.
 */
export declare function box(rows: string[], minWidth?: number): string[];
/** Build a left/right justified line of total visible `width`. */
export declare function spread(left: string, right: string, width: number): string;
/** A `label  value` row with the label dimmed and padded to `labelWidth`. */
export declare function kv(label: string, value: string, labelWidth?: number): string;
/** A section header (uppercased, accented). */
export declare function sectionTitle(title: string): string;
/** A status line such as "✓ Ready in 3.2s". `kind` picks the glyph + colour. */
export declare function statusLine(kind: 'step' | 'ok' | 'warn' | 'err' | 'info', msg: string): string;
/** Warnings emitted during startup, collected for an end-of-startup summary. */
export declare const startupWarnings: string[];
/**
 * Convenience status loggers for the startup sequence. Resolve console.*
 * lazily at call time so stdio/HTTP overrides installed in main() apply.
 *  - step/ok/info → stdout (suppressed in stdio mode)
 *  - warn/err     → stderr (kept visible to MCP clients in stdio mode)
 *  - detail       → dimmed, indented sub-line under the preceding status
 */
export declare const log: {
    step: (msg: string) => void;
    ok: (msg: string) => void;
    info: (msg: string) => void;
    warn: (msg: string) => void;
    err: (msg: string) => void;
    detail: (msg: string) => void;
};
/**
 * Render a path relative to `cwd` (prefixed with "./") when it lives under it,
 * otherwise return the absolute path unchanged. Keeps long startup paths short.
 */
export declare function shortPath(p: string, cwd?: string): string;
//# sourceMappingURL=terminalUi.d.ts.map