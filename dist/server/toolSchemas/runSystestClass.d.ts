/**
 * MCP tool definition for `run_systest_class` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const runSystestClassTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            className: {
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
            testMethod: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=runSystestClass.d.ts.map