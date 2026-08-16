/**
 * MCP tool definition for `prepare` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const prepareTool: {
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
            goal: {
                type: string;
                description: string;
            };
            objectName: {
                type: string;
                description: string;
            };
            objectType: {
                type: string;
                enum: string[];
                description: string;
            };
            methodName: {
                type: string;
                description: string;
            };
            operation: {
                type: string;
                description: string;
            };
            proposedName: {
                type: string;
                description: string;
            };
            fieldsHint: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=prepare.d.ts.map