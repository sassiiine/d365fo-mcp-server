/**
 * MCP tool definition for `validate_code` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const validateCodeTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            mode: {
                type: string;
                enum: string[];
                description: string;
            };
            code: {
                type: string;
                description: string;
            };
            codeType: {
                type: string;
                enum: string[];
                default: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=validateCode.d.ts.map