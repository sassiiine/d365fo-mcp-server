interface SessionOptions {
    json?: boolean;
    format?: string;
    /** How many rows of the per-tool table to print. */
    top?: string;
}
export declare function sessionCommand(logPath: string | undefined, opts?: SessionOptions): Promise<void>;
export {};
//# sourceMappingURL=session.d.ts.map