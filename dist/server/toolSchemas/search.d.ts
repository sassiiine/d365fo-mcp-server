/**
 * MCP tool definition for `search` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const searchTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            scope: {
                type: string;
                enum: string[];
                default: string;
                description: string;
            };
            query: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
            prefix: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            verbose: {
                type: string;
                default: boolean;
                description: string;
            };
            workspacePath: {
                type: string;
                description: string;
            };
            includeWorkspace: {
                type: string;
                default: boolean;
                description: string;
            };
            queries: {
                type: string;
                description: string;
                minItems: number;
                maxItems: number;
                items: {
                    type: string;
                    properties: {
                        query: {
                            type: string;
                            description: string;
                        };
                        type: {
                            type: string;
                            default: string;
                            description: string;
                        };
                        limit: {
                            type: string;
                            default: number;
                            description: string;
                        };
                        workspacePath: {
                            type: string;
                            description: string;
                        };
                        includeWorkspace: {
                            type: string;
                            default: boolean;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            globalTypeFilter: {
                type: string;
                maxItems: number;
                description: string;
                items: {
                    type: string;
                };
            };
            deduplicate: {
                type: string;
                default: boolean;
                description: string;
            };
            crossReference: {
                type: string;
                default: boolean;
                description: string;
            };
        };
    };
};
//# sourceMappingURL=search.d.ts.map