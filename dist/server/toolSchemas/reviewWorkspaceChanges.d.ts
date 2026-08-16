/**
 * MCP tool definition for `review_workspace_changes` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const reviewWorkspaceChangesTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            directoryPath: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=reviewWorkspaceChanges.d.ts.map