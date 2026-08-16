/**
 * MCP tool definition for `undo_last_modification` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const undoLastModificationTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            filePath: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=undoLastModification.d.ts.map