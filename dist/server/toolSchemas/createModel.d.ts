/**
 * MCP tool definition for `create_d365fo_model`.
 *
 * Model creation was a PowerShell script the customer ran by hand, which meant
 * an agent that found the target model missing could only stop and explain. It
 * is a local operation (directories, two XML files, a junction) and belongs with
 * the other local tools.
 *
 * The descriptions here are deliberately terse: every tool's schema is sent on
 * every ListTools, so prose costs context in every session
 * (tests/utils/toolSchemaBudget.test.ts enforces the ceiling). Detail belongs in
 * the tool's RESPONSE, which is only paid for when the tool is actually used.
 */
export declare const createModelTool: {
    readonly name: 'create_d365fo_model';
    readonly description: string;
    readonly inputSchema: {
        readonly type: 'object';
        readonly properties: {
            readonly modelName: {
                readonly type: 'string';
                readonly description: 'Letters/digits/underscore, starting with a letter. Use your prefix.';
            };
            readonly repoRoot: {
                readonly type: 'string';
                readonly description: string;
            };
            readonly description: {
                readonly type: 'string';
            };
            readonly publisher: {
                readonly type: 'string';
            };
            readonly layer: {
                readonly type: 'number';
                readonly description: 'AOT layer; 14 (USR) for customer code.';
            };
            readonly moduleReferences: {
                readonly type: 'array';
                readonly items: {
                    readonly type: 'string';
                };
                readonly description: 'Modules to reference. Default covers the standard EDTs.';
            };
            readonly packagesPath: {
                readonly type: 'string';
                readonly description: 'PackagesLocalDirectory override.';
            };
        };
        readonly required: readonly ['modelName'];
    };
};
//# sourceMappingURL=createModel.d.ts.map