/**
 * MCP tool definition for `get_knowledge` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const getKnowledgeTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            kind: {
                type: string;
                enum: string[];
                description: string;
            };
            topic: {
                type: string;
                description: string;
            };
            format: {
                type: string;
                enum: string[];
                default: string;
                description: string;
            };
            errorText: {
                type: string;
                description: string;
            };
            errorCode: {
                type: string;
                description: string;
            };
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            moniker: {
                type: string;
                description: string;
            };
            path: {
                type: string;
                description: string;
            };
            justification: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
};
//# sourceMappingURL=getKnowledge.d.ts.map