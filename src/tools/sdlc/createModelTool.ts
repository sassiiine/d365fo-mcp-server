/**
 * `create_d365fo_model` handler for the full server.
 *
 * Thin wrapper over src/agent/createModel.ts so the full server and the thin
 * agent create models identically - two implementations of a descriptor would
 * drift, and a model that differs by layer or module references fails in ways
 * that point at the objects inside it rather than at the model.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
import { createModel } from '../../agent/createModel.js';
import { getConfigManager } from '../../utils/configManager.js';

export async function createModelToolHandler(request: CallToolRequest, _context: XppServerContext) {
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;

  try {
    // Fall back to the configured packages path so a caller who has already told
    // the server where D365FO lives does not have to repeat it.
    let packagesPath = args.packagesPath as string | undefined;
    if (!packagesPath) {
      try {
        const cfg = getConfigManager();
        await cfg.ensureLoaded();
        packagesPath = cfg.getPackagePath() ?? undefined;
      } catch { /* fall through to the env var inside createModel */ }
    }

    const r = await createModel({
      modelName: args.modelName as string,
      repoRoot: args.repoRoot as string | undefined,
      packagesPath,
      description: args.description as string | undefined,
      publisher: args.publisher as string | undefined,
      layer: args.layer as number | undefined,
      moduleReferences: args.moduleReferences as string[] | undefined,
    });

    return {
      content: [{
        type: 'text',
        text:
          `✅ Created model ${r.modelName} (id ${r.modelId})\n\n` +
          `📁 Metadata: ${r.metadataPath}\n` +
          `📄 Project : ${r.projectPath}\n` +
          (r.linkedFrom ? `🔗 Linked  : ${r.linkedFrom}\n` : '') +
          (r.warnings.length ? `\n⚠️ ${r.warnings.join('\n⚠️ ')}\n` : '') +
          `\nNext: write objects into it with d365fo_file, then build with ` +
          `build_d365fo_project(modelName="${r.modelName}", fullBuild=true).`,
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `❌ Could not create the model: ${error instanceof Error ? error.message : String(error)}`,
      }],
      isError: true,
    };
  }
}
