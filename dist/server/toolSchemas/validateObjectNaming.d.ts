/**
 * MCP tool definition for `validate_object_naming` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const validateObjectNamingTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            proposedName: {
                type: string;
                description: string;
            };
            objectType: {
                type: string;
                enum: string[];
                description: string;
            };
            baseObjectName: {
                type: string;
                description: string;
            };
            modelPrefix: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=validateObjectNaming.d.ts.map