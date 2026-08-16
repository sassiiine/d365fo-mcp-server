export declare const batchGetInfoTool: {
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
                        name: {
                            type: string;
                            description: string;
                        };
                        type: {
                            type: string;
                            enum: ("view" | "data-entity" | "class" | "table" | "form" | "query" | "enum" | "edt" | "report" | "security-privilege" | "security-duty" | "security-role" | "table-extension" | "class-extension" | "form-extension" | "enum-extension" | "edt-extension" | "data-entity-extension" | "service" | "map" | "security-policy" | "macro" | "menu-item" | "config-key")[];
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
//# sourceMappingURL=batchGetInfo.d.ts.map