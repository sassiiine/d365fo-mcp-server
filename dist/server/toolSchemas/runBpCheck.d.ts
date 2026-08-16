/**
 * MCP tool definition for `run_bp_check` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const runBpCheckTool: {
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
            targetFilter: {
                type: string;
                description: string;
            };
            targetElementType: {
                type: string;
                description: string;
            };
            modelName: {
                type: string;
                description: string;
            };
            packagePath: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
//# sourceMappingURL=runBpCheck.d.ts.map