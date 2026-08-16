/**
 * MCP tool definition for `security_info` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const securityInfoTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            mode: {
                type: string;
                enum: string[];
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            artifactType: {
                type: string;
                enum: string[];
                description: string;
            };
            includeChain: {
                type: string;
                description: string;
                default: boolean;
            };
            objectName: {
                type: string;
                description: string;
            };
            objectType: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=securityInfo.d.ts.map