/**
 * MCP tool definition for `object_patterns` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const objectPatternsTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            domain: {
                type: string;
                enum: string[];
                description: string;
            };
            tableGroup: {
                type: string;
                enum: string[];
                description: string;
            };
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            formPattern: {
                type: string;
                enum: string[];
                description: string;
            };
            dataSource: {
                type: string;
                description: string;
            };
            similarTo: {
                type: string;
                description: string;
            };
            recommend: {
                type: string;
                description: string;
                properties: {
                    entityKind: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                    hasHeaderLines: {
                        type: string;
                        description: string;
                    };
                    fieldCount: {
                        type: string;
                        description: string;
                    };
                    usageIntent: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                    tableName: {
                        type: string;
                        description: string;
                    };
                };
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            pattern: {
                type: string;
                description: string;
            };
            xml: {
                type: string;
                description: string;
            };
            formName: {
                type: string;
                description: string;
            };
            filePath: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
//# sourceMappingURL=objectPatterns.d.ts.map