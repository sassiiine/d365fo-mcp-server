export interface XppcDiagnostic {
    severity: 'error' | 'warning';
    /** Element kind as reported by xppc, e.g. "Class Method", "Table Field" */
    kind?: string;
    model?: string;
    object?: string;
    member?: string;
    line?: number;
    column?: number;
    message: string;
}
/** Parse xppc log content into structured diagnostics. */
export declare function parseXppcDiagnostics(logContent: string): XppcDiagnostic[];
/**
 * Render diagnostics as a numbered, machine-actionable block. Errors come
 * first; duplicate messages are collapsed; the first few distinct errors are
 * enriched with a fix hint from the get_d365fo_error_help knowledge base so
 * the model can correct everything in one round.
 */
export declare function formatStructuredDiagnostics(diagnostics: XppcDiagnostic[], maxItems?: number): string;
export declare const buildProjectTool: (params: any, _context: any) => Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=buildProject.d.ts.map