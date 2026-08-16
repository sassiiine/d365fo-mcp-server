/**
 * MCP tool definition for `update_symbol_index` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const updateSymbolIndexTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            filePath: {
                type: string[];
                items: {
                    type: string;
                };
                description: string;
            };
        };
    };
};
//# sourceMappingURL=updateSymbolIndex.d.ts.map