/**
 * MCP tool definition for `extension_info` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const extensionInfoTool: {
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
            target: {
                type: string;
                description: string;
            };
            method: {
                type: string;
                description: string;
            };
            objectType: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
            goal: {
                type: string;
                description: string;
            };
            scenario: {
                type: string;
                enum: string[];
                description: string;
            };
            handlerType: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
            includeEventHandlers: {
                type: string;
                description: string;
                default: boolean;
            };
            includeEffectiveSchema: {
                type: string;
                description: string;
                default: boolean;
            };
            showExistingExtensions: {
                type: string;
                description: string;
                default: boolean;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=extensionInfo.d.ts.map