/**
 * MCP tool definition for `analyze_code` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const analyzeCodeTool: {
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
            scenario: {
                type: string;
                description: string;
            };
            classPattern: {
                type: string;
                description: string;
            };
            methodName: {
                type: string;
                description: string;
            };
            parameters: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        name: {
                            type: string;
                        };
                        type: {
                            type: string;
                        };
                    };
                    required: string[];
                };
            };
            returnType: {
                type: string;
                default: string;
                description: string;
            };
            className: {
                type: string;
                description: string;
            };
            apiName: {
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
//# sourceMappingURL=analyzeCode.d.ts.map