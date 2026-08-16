/**
 * MCP tool definition for `generate_object` (name/description/inputSchema).
 *
 * Like `d365fo_file`, this carries the DISCRIMINATORS only (mode / pattern /
 * objectType as closed enums) plus a free-form `params`. The per-mode parameter
 * contract lives in src/tools/generateObjectOpSpecs.ts and is fetched on demand
 * via get_knowledge(kind="op-spec", topic="<mode>"), because this payload is
 * re-sent on every request while a call uses exactly one mode (issue #825).
 * The dispatcher merges `{...args, ...args.params}`, and a call missing a
 * required parameter is answered with the mode's complete spec.
 *
 * Serialized payload must not change unintentionally —
 * tests/utils/toolSchemaBudget.test.ts ratchets its size.
 */
export declare const generateObjectTool: {
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
};
//# sourceMappingURL=generateObject.d.ts.map