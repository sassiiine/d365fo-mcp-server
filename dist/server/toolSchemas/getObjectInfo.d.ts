export declare const getObjectInfoTool: {
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
};
//# sourceMappingURL=getObjectInfo.d.ts.map