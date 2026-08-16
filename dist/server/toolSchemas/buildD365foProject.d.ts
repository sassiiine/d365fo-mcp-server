/**
 * MCP tool definition for `build_d365fo_project` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const buildD365foProjectTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            modelName: {
                type: string;
                description: string;
            };
            projectPath: {
                type: string;
                description: string;
            };
            force: {
                type: string;
                description: string;
            };
            fullBuild: {
                type: string;
                description: string;
            };
            buildReferencedModels: {
                type: string;
                description: string;
            };
            wait: {
                type: string;
                description: string;
            };
            waitTimeoutMs: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
//# sourceMappingURL=buildD365foProject.d.ts.map