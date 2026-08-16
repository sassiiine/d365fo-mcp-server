/**
 * MCP tool definition for `get_workspace_info` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const getWorkspaceInfoTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            projectName: {
                type: string;
                description: string;
            };
            projectPath: {
                type: string;
                description: string;
            };
            diagnostics: {
                type: string;
                default: boolean;
                description: string;
            };
        };
        required: never[];
    };
};
//# sourceMappingURL=getWorkspaceInfo.d.ts.map