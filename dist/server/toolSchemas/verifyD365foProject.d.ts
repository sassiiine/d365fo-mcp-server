/**
 * MCP tool definition for `verify_d365fo_project` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const verifyD365foProjectTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            objects: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        objectType: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        objectName: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            projectPath: {
                type: string;
                description: string;
            };
            modelName: {
                type: string;
                description: string;
            };
            packageName: {
                type: string;
                description: string;
            };
            packagePath: {
                type: string;
                description: string;
            };
        };
    };
};
//# sourceMappingURL=verifyD365foProject.d.ts.map