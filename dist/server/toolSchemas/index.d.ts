export declare const toolSchemas: ({
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            scope: {
                type: string;
                enum: string[];
                default: string;
                description: string;
            };
            query: {
                type: string;
                description: string;
            };
            type: {
                type: string;
                enum: string[];
                description: string;
                default: string;
            };
            prefix: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                description: string;
                default: number;
            };
            verbose: {
                type: string;
                default: boolean;
                description: string;
            };
            workspacePath: {
                type: string;
                description: string;
            };
            includeWorkspace: {
                type: string;
                default: boolean;
                description: string;
            };
            queries: {
                type: string;
                description: string;
                minItems: number;
                maxItems: number;
                items: {
                    type: string;
                    properties: {
                        query: {
                            type: string;
                            description: string;
                        };
                        type: {
                            type: string;
                            default: string;
                            description: string;
                        };
                        limit: {
                            type: string;
                            default: number;
                            description: string;
                        };
                        workspacePath: {
                            type: string;
                            description: string;
                        };
                        includeWorkspace: {
                            type: string;
                            default: boolean;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            globalTypeFilter: {
                type: string;
                maxItems: number;
                description: string;
                items: {
                    type: string;
                };
            };
            deduplicate: {
                type: string;
                default: boolean;
                description: string;
            };
            crossReference: {
                type: string;
                default: boolean;
                description: string;
            };
        };
    };
} | {
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
            modelName: {
                type: string;
                description: string;
            };
            pattern: {
                type: string;
                enum: string[];
                description: string;
            };
            objectType: {
                type: string;
                enum: string[];
                description: string;
            };
            params: {
                type: string;
                additionalProperties: boolean;
                description: string;
            };
        };
        required: string[];
    };
} | {
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
            scenario: {
                type: string;
                description: string;
            };
            classPattern: {
                type: string;
                description: string;
            };
            methodName: {
                type: string;
                description: string;
            };
            parameters: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        name: {
                            type: string;
                        };
                        type: {
                            type: string;
                        };
                    };
                    required: string[];
                };
            };
            returnType: {
                type: string;
                default: string;
                description: string;
            };
            className: {
                type: string;
                description: string;
            };
            apiName: {
                type: string;
                description: string;
            };
            context: {
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
} | {
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
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            objects: {
                type: string;
                minItems: number;
                maxItems: number;
                description: string;
                items: {
                    type: string;
                    properties: {
                        objectType: {
                            type: string;
                            enum: ("class" | "class-extension" | "config-key" | "data-entity" | "data-entity-extension" | "edt" | "edt-extension" | "enum" | "enum-extension" | "form" | "form-extension" | "macro" | "map" | "menu-item" | "query" | "report" | "security-policy" | "service" | "table" | "table-extension" | "view")[];
                            description: string;
                        };
                        objectName: {
                            type: string;
                            description: string;
                        };
                        options: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            objectType: {
                type: string;
                enum: ("class" | "class-extension" | "config-key" | "data-entity" | "data-entity-extension" | "edt" | "edt-extension" | "enum" | "enum-extension" | "form" | "form-extension" | "macro" | "map" | "menu-item" | "query" | "report" | "security-policy" | "service" | "table" | "table-extension" | "view")[];
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            options: {
                type: string;
                description: string;
            };
        };
    };
} | {
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
} | {
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
} | {
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
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            proposedName: {
                type: string;
                description: string;
            };
            objectType: {
                type: string;
                enum: string[];
                description: string;
            };
            baseObjectName: {
                type: string;
                description: string;
            };
            modelPrefix: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
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
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            objects: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        objectType: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        objectName: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            projectPath: {
                type: string;
                description: string;
            };
            modelName: {
                type: string;
                description: string;
            };
            packageName: {
                type: string;
                description: string;
            };
            packagePath: {
                type: string;
                description: string;
            };
        };
    };
} | {
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
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            modelName: {
                type: string;
                description: string;
            };
            projectPath: {
                type: string;
                description: string;
            };
            force: {
                type: string;
                description: string;
            };
            fullBuild: {
                type: string;
                description: string;
            };
            buildReferencedModels: {
                type: string;
                description: string;
            };
            wait: {
                type: string;
                description: string;
            };
            waitTimeoutMs: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
} | {
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
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            objects: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        objectType: {
                            type: string;
                            description: string;
                        };
                        objectName: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            projectPath: {
                type: string;
                description: string;
            };
            targetFilter: {
                type: string;
                description: string;
            };
            targetElementType: {
                type: string;
                description: string;
            };
            modelName: {
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
} | {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            className: {
                type: string;
                description: string;
            };
            modelName: {
                type: string;
                description: string;
            };
            packagePath: {
                type: string;
                description: string;
            };
            testMethod: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
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
} | {
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
} | {
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
} | {
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
            code: {
                type: string;
                description: string;
            };
            codeType: {
                type: string;
                enum: string[];
                default: string;
                description: string;
            };
            context: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
} | {
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
            goal: {
                type: string;
                description: string;
            };
            objectName: {
                type: string;
                description: string;
            };
            objectType: {
                type: string;
                enum: string[];
                description: string;
            };
            methodName: {
                type: string;
                description: string;
            };
            operation: {
                type: string;
                description: string;
            };
            proposedName: {
                type: string;
                description: string;
            };
            fieldsHint: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
        };
        required: string[];
    };
})[];
//# sourceMappingURL=index.d.ts.map