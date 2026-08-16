/**
 * MCP tool definition for `suggest_edt` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const suggestEdtTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            fieldName: {
                type: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=suggestEdt.d.ts.map