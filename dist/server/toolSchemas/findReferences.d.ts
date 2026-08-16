/**
 * MCP tool definition for `find_references` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const findReferencesTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            targetName: {
                type: string;
                description: string;
            };
            targetType: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
            ownerName: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=findReferences.d.ts.map