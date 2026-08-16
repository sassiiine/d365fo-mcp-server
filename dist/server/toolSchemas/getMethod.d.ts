/**
 * MCP tool definition for `get_method` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const getMethodTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            include: {
                type: string;
                enum: string[];
                default: string;
                description: string;
            };
            className: {
                type: string;
                description: string;
            };
            methodName: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=getMethod.d.ts.map