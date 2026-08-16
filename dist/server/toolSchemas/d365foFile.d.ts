/**
 * MCP tool definition for `d365fo_file` (name/description/inputSchema).
 *
 * Deliberately carries the DISCRIMINATORS only (action / objectType /
 * operation as closed enums) — never the parameters behind them. The per-
 * operation and per-objectType contracts live in src/tools/d365foFileOpSpecs.ts
 * and are fetched on demand via get_knowledge(kind="op-spec", topic=…), because
 * this payload is re-sent on every request while a call needs exactly one of
 * them (issue #825). Every missing-parameter error names that lookup, so the
 * contract stays one call away.
 *
 * Serialized payload must not change unintentionally —
 * tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const d365foFileTool: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            objectType: {
                type: string;
                enum: string[];
                description: string;
            };
            objectName: {
                type: string;
                description: string;
            };
            modelName: {
                type: string;
                description: string;
            };
            sourceCode: {
                type: string;
                description: string;
            };
            properties: {
                type: string;
                additionalProperties: boolean;
                description: string;
            };
            addToProject: {
                type: string;
                description: string;
                default: boolean;
            };
            projectPath: {
                type: string;
                description: string;
            };
            xmlContent: {
                type: string;
                description: string;
            };
            overwrite: {
                type: string;
                description: string;
                default: boolean;
            };
            groundingToken: {
                type: string;
                description: string;
            };
            operation: {
                type: string;
                enum: string[];
                description: string;
            };
            operations: {
                type: string;
                maxItems: number;
                description: string;
                items: {
                    type: string;
                    additionalProperties: boolean;
                };
            };
            params: {
                type: string;
                additionalProperties: boolean;
                description: string;
            };
            createBackup: {
                type: string;
                description: string;
                default: boolean;
            };
            filePath: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
//# sourceMappingURL=d365foFile.d.ts.map