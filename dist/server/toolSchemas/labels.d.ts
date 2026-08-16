/**
 * MCP tool definition for `labels` (name/description/inputSchema),
 * extracted verbatim from mcpServer.ts. Serialized payload must not change
 * unintentionally — tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const labelsTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            params: {
                type: string;
                additionalProperties: boolean;
                description: string;
            };
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            model: {
                type: string;
                description: string;
            };
            labelFileId: {
                type: string;
                description: string;
            };
            language: {
                type: string;
                description: string;
            };
            maxResults: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
            };
            verbose: {
                type: string;
                description: string;
            };
            query: {
                type: string[];
                items: {
                    type: string;
                };
                description: string;
            };
            labelId: {
                type: string;
                description: string;
            };
            labels: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        labelId: {
                            type: string;
                            description: string;
                        };
                        translations: {
                            type: string;
                            items: {
                                type: string;
                                properties: {
                                    language: {
                                        type: string;
                                        description: string;
                                    };
                                    text: {
                                        type: string;
                                        description: string;
                                    };
                                    comment: {
                                        type: string;
                                        description: string;
                                    };
                                };
                                required: string[];
                            };
                        };
                    };
                    required: string[];
                };
            };
            translations: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        language: {
                            type: string;
                            description: string;
                        };
                        text: {
                            type: string;
                            description: string;
                        };
                        comment: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            oldLabelId: {
                type: string;
                description: string;
            };
            newLabelId: {
                type: string;
                description: string;
            };
            dryRun: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=labels.d.ts.map