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
export const createModelTool = {
  name: 'create_d365fo_model',
  description:
    'Create a new D365FO model: descriptor, AOT folders, .rnrproj and the PackagesLocalDirectory link. ' +
    'Call when the target model does not exist. Local-only.',
  inputSchema: {
    type: 'object',
    properties: {
      modelName: { type: 'string', description: 'Letters/digits/underscore, starting with a letter. Use your prefix.' },
      repoRoot: {
        type: 'string',
        description:
          'Metadata repo root (contains Metadata\\ and Projects\\). Given: created there and junctioned in, so it ' +
          'stays under source control. Omitted: created directly in PackagesLocalDirectory.',
      },
      description: { type: 'string' },
      publisher: { type: 'string' },
      layer: { type: 'number', description: 'AOT layer; 14 (USR) for customer code.' },
      moduleReferences: {
        type: 'array', items: { type: 'string' },
        description: 'Modules to reference. Default covers the standard EDTs.',
      },
      packagesPath: { type: 'string', description: 'PackagesLocalDirectory override.' },
    },
    required: ['modelName'],
  },
} as const;
