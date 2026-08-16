/** First active (non-commented) value of `key`, or null. */
export declare function getValue(content: string, key: string): string | null;
/** Replace the active line, else un-comment a commented one, else append. */
export declare function setValue(content: string, key: string, value: string): string;
/**
 * All variable names present in the file. Commented-out assignments
 * ("# KEY=value") count as present-but-disabled so the missing-settings
 * check doesn't nag about vars a user intentionally left commented.
 */
export declare function varNames(content: string): string[];
/** Vars in `exampleContent` that are absent from `envContent`, with example values. */
export declare function missingVars(exampleContent: string, envContent: string): {
    name: string;
    value: string;
}[];
export declare function readEnvValue(envFile: string, key: string): string | null;
//# sourceMappingURL=envFile.d.ts.map