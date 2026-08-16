/**
 * MCP tool definition for `trigger_db_sync` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const triggerDbSyncTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            modelName: {
                type: string;
                description: string;
            };
            tables: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            tableName: {
                type: string;
                description: string;
            };
            projectPath: {
                type: string;
                description: string;
            };
            syncViews: {
                type: string;
                description: string;
            };
            connectionString: {
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
//# sourceMappingURL=triggerDbSync.d.ts.map