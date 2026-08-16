import { createModel } from '../../agent/createModel.js';
import { getConfigManager } from '../../utils/configManager.js';
export async function createModelToolHandler(request, _context) {
    const args = (request.params.arguments ?? {});
    try {
        // Fall back to the configured packages path so a caller who has already told
        // the server where D365FO lives does not have to repeat it.
        let packagesPath = args.packagesPath;
        if (!packagesPath) {
            try {
                const cfg = getConfigManager();
                await cfg.ensureLoaded();
                packagesPath = cfg.getPackagePath() ?? undefined;
            }
            catch { /* fall through to the env var inside createModel */ }
        }
        const r = await createModel({
            modelName: args.modelName,
            repoRoot: args.repoRoot,
            packagesPath,
            description: args.description,
            publisher: args.publisher,
            layer: args.layer,
            moduleReferences: args.moduleReferences,
        });
        return {
            content: [{
                    type: 'text',
                    text: `✅ Created model ${r.modelName} (id ${r.modelId})\n\n` +
                        `📁 Metadata: ${r.metadataPath}\n` +
                        `📄 Project : ${r.projectPath}\n` +
                        (r.linkedFrom ? `🔗 Linked  : ${r.linkedFrom}\n` : '') +
                        (r.warnings.length ? `\n⚠️ ${r.warnings.join('\n⚠️ ')}\n` : '') +
                        `\nNext: write objects into it with d365fo_file, then build with ` +
                        `build_d365fo_project(modelName="${r.modelName}", fullBuild=true).`,
                }],
        };
    }
    catch (error) {
        return {
            content: [{
                    type: 'text',
                    text: `❌ Could not create the model: ${error instanceof Error ? error.message : String(error)}`,
                }],
            isError: true,
        };
    }
}
//# sourceMappingURL=createModelTool.js.map