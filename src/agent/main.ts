/**
 * The thin D365FO agent.
 *
 * Runs on the customer's Windows machine and does only what cannot be done
 * anywhere else: put files on that disk and run that machine's compiler. It has
 * no symbol index, no generator, no validator, no knowledge base and no network
 * calls of its own.
 *
 * Why a separate entry point rather than the full server in write-only mode:
 * MCP_SERVER_MODE=write-only correctly HIDES the read tools, but the code is
 * still there - the shipped bundle carried the generator templates (321 KB), the
 * knowledge base (425 KB) and the validator, because one entry point imports
 * every handler. Hiding a tool is an access-control decision; not shipping it is
 * a packaging one, and only the second keeps the logic off the customer's disk.
 *
 * Everything of value therefore stays on the hosted server: what leaves is the
 * XML it produced, and this process writes it down.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

import { promises as fs } from 'node:fs';
import { EOL } from 'node:os';
import { writeObject, resolveObjectPath } from './writeObject.js';
import { AOT_FOLDERS } from './aotFolders.js';
import { buildModel } from './buildModel.js';
import { createModel } from './createModel.js';

const VERSION = '1.0.0';

const OBJECT_TYPES = Object.keys(AOT_FOLDERS);

const TOOLS = [
  {
    name: 'd365fo_file',
    description:
      'Write an AOT object to this machine. action="create" (or "modify") with xmlContent authored by the hosted ' +
      'server. This agent does NOT generate XML — call d365fo_file(action="generate") on the hosted server first, ' +
      'then pass the XML here verbatim.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['create', 'modify'], description: 'Both write xmlContent to disk.' },
        objectType: { type: 'string', enum: OBJECT_TYPES },
        objectName: { type: 'string' },
        modelName: { type: 'string', description: 'Target model. Defaults to D365FO_MODEL_NAME.' },
        xmlContent: { type: 'string', description: 'Complete AOT XML, written verbatim. Required.' },
        projectPath: { type: 'string', description: 'Absolute .rnrproj path to register the file in.' },
        packagePath: { type: 'string', description: 'Packages root; defaults to D365FO_PACKAGE_PATH.' },
        overwrite: { type: 'boolean', description: 'Replace an existing file.' },
      },
      required: ['action', 'objectType', 'objectName', 'xmlContent'],
    },
  },
  {
    name: 'build_d365fo_project',
    description:
      'Compile a model with xppc. Returns the compiler output verbatim — diagnosis of the errors belongs to the ' +
      'hosted server, which has the index needed to explain them.',
    inputSchema: {
      type: 'object',
      properties: {
        modelName: { type: 'string', description: 'Model to build. Defaults to D365FO_MODEL_NAME.' },
        fullBuild: {
          type: 'boolean',
          description:
            'Full recompile of the target model. Default false is INCREMENTAL, which only compiles changed ' +
            'elements and reports success without revisiting the rest — never call a task done on an incremental green.',
        },
      },
    },
  },
  {
    name: 'verify_d365fo_project',
    description: 'Confirm objects exist on disk and report their size, so a write can be checked without a build.',
    inputSchema: {
      type: 'object',
      properties: {
        objects: {
          type: 'array',
          description: 'Objects to check.',
          items: {
            type: 'object',
            properties: { objectType: { type: 'string' }, objectName: { type: 'string' }, modelName: { type: 'string' } },
            required: ['objectType', 'objectName'],
          },
        },
      },
      required: ['objects'],
    },
  },
  {
    name: 'create_d365fo_model',
    description:
      'Create a new D365FO model on this machine: descriptor, AOT folder skeleton, Visual Studio project, and the ' +
      'PackagesLocalDirectory link. Use this when the target model does not exist yet — objects cannot be written ' +
      'into a model that has not been created.',
    inputSchema: {
      type: 'object',
      properties: {
        modelName: { type: 'string', description: 'Letters, digits and underscores; use your own prefix.' },
        repoRoot: {
          type: 'string',
          description:
            'Metadata repo root containing Metadata\\ and Projects\\. Given, the model is created there and ' +
            'junctioned into PackagesLocalDirectory so it is under source control. Omitted, it is created ' +
            'directly under PackagesLocalDirectory.',
        },
        description: { type: 'string' },
        publisher: { type: 'string' },
        layer: { type: 'number', description: 'AOT layer; 14 (USR) unless you have a reason.' },
        moduleReferences: {
          type: 'array', items: { type: 'string' },
          description: 'Modules the model may reference. Defaults cover the standard EDTs.',
        },
      },
      required: ['modelName'],
    },
  },
  {
    name: 'get_workspace_info',
    description: 'Report the paths and model this agent is configured with, and what it can and cannot do.',
    inputSchema: { type: 'object', properties: {} },
  },
];

const text = (s: string, isError = false) => ({ content: [{ type: 'text', text: s }], ...(isError ? { isError: true } : {}) });

/** Compile the model. Diagnostics are the compiler's own words; see buildModel.ts. */
async function runBuild(modelName: string, fullBuild: boolean): Promise<string> {
  const packagesPath = process.env.D365FO_PACKAGE_PATH;
  if (!packagesPath) return 'D365FO_PACKAGE_PATH is not set; cannot locate the packages root.';

  const r = await buildModel({ modelName, packagesPath, fullBuild });
  const head = r.ok
    ? `Build succeeded - ${modelName}, ${r.fullBuild ? 'FULL' : 'incremental'}, ${(r.durationMs / 1000).toFixed(0)}s`
    : `BUILD FAILED - ${modelName}, ${r.fullBuild ? 'FULL' : 'incremental'}, ${(r.durationMs / 1000).toFixed(0)}s`;

  const lines = [head, r.labels, ''];
  if (!r.fullBuild) {
    lines.push(
      'Incremental: unchanged elements were NOT recompiled, so a clean result here says',
      'nothing about the model as a whole. Re-run with fullBuild=true before calling the',
      'task done.', '',
    );
  }
  if (r.errors.length) {
    lines.push(`${r.errors.length} error(s):`);
    for (const d of r.errors.slice(0, 25)) {
      const where = [d.object, d.member].filter(Boolean).join('/');
      const at = d.line ? ` (line ${d.line}${d.column ? ', col ' + d.column : ''})` : '';
      lines.push(`  ${where || d.kind || '(no location)'}${at}: ${d.message}`);
    }
    if (r.errors.length > 25) lines.push(`  … ${r.errors.length - 25} more`);
  }
  // xppc counted errors this parser could not itemise — say so rather than
  // present a short list as if it were the whole story.
  if (r.reportedErrorCount !== null && r.reportedErrorCount > r.errors.length) {
    lines.push('', `xppc counted ${r.reportedErrorCount} error(s) but only ${r.errors.length} could be parsed.`,
      'Ask the hosted server to interpret the raw log below.');
  }
  if (r.warnings.length) lines.push('', `${r.warnings.length} warning(s).`);

  lines.push('', '--- xppc log (tail) ---', r.log.slice(-4000));
  return lines.join(EOL);
}

async function handle(name: string, args: Record<string, unknown>) {
  const model = (args.modelName as string) || process.env.D365FO_MODEL_NAME || '';

  switch (name) {
    case 'd365fo_file': {
      if (!model) return text('No model. Pass modelName or set D365FO_MODEL_NAME.', true);
      const r = await writeObject({
        objectType: args.objectType as string,
        objectName: args.objectName as string,
        modelName: model,
        xmlContent: args.xmlContent as string,
        projectPath: args.projectPath as string | undefined,
        packagePath: args.packagePath as string | undefined,
        overwrite: Boolean(args.overwrite),
      });
      return text(
        `Wrote ${args.objectType} ${args.objectName} (${r.bytes} bytes)\n` +
        `Path: ${r.path}\n` +
        `Project: ${r.addedToProject ? 'registered' : 'not registered'}\n` +
        (r.warnings.length ? `\n${r.warnings.map(w => `- ${w}`).join('\n')}\n` : '') +
        `\nNext: build_d365fo_project(modelName="${model}", fullBuild=true).`,
      );
    }

    case 'build_d365fo_project': {
      if (!model) return text('No model. Pass modelName or set D365FO_MODEL_NAME.', true);
      const full = Boolean(args.fullBuild);
      const out = await runBuild(model, full);
      return text(out, /^BUILD FAILED/.test(out));
    }

    case 'verify_d365fo_project': {
      const objects = (args.objects as Array<Record<string, string>>) ?? [];
      const lines: string[] = [];
      for (const o of objects) {
        try {
          const p = resolveObjectPath({
            objectType: o.objectType, objectName: o.objectName, modelName: o.modelName || model,
          });
          const st = await fs.stat(p).catch(() => null);
          lines.push(st ? `OK      ${o.objectType} ${o.objectName} — ${st.size} bytes` : `MISSING ${o.objectType} ${o.objectName} — ${p}`);
        } catch (e) {
          lines.push(`ERROR   ${o.objectType} ${o.objectName} — ${e instanceof Error ? e.message : e}`);
        }
      }
      return text(lines.join('\n') || 'No objects given.', lines.some(l => l.startsWith('MISSING')));
    }

    case 'create_d365fo_model': {
      const r = await createModel({
        modelName: args.modelName as string,
        repoRoot: args.repoRoot as string | undefined,
        description: args.description as string | undefined,
        publisher: args.publisher as string | undefined,
        layer: args.layer as number | undefined,
        moduleReferences: args.moduleReferences as string[] | undefined,
      });
      // Creating a model is only ever done in order to build in it, so it
      // becomes the session default. Without this, every following call fell
      // back to D365FO_MODEL_NAME and silently wrote into the *previous* model
      // unless the agent repeated modelName on each one — which looked from the
      // outside like the tool creating one model and then refusing to move on.
      process.env.D365FO_MODEL_NAME = r.modelName;
      return text(
        `${r.alreadyExisted ? 'Model already exists' : 'Created model'} ${r.modelName} (id ${r.modelId})\n` +
        `Metadata: ${r.metadataPath}\n` +
        `Project : ${r.projectPath}\n` +
        (r.linkedFrom ? `Linked  : ${r.linkedFrom}\n` : '') +
        (r.warnings.length ? `\n${r.warnings.map(w => `- ${w}`).join('\n')}\n` : '') +
        `\n${r.modelName} is now the default model for this session — d365fo_file and ` +
        `build_d365fo_project will use it unless you pass modelName explicitly.\n` +
        `Write objects with d365fo_file(projectPath="${r.projectPath}").`,
      );
    }

    case 'get_workspace_info':
      return text(
        `D365FO thin agent v${VERSION}\n\n` +
        `Packages : ${process.env.D365FO_PACKAGE_PATH ?? '(unset)'}\n` +
        `Model    : ${process.env.D365FO_MODEL_NAME ?? '(unset)'}\n` +
        `Node     : ${process.version}\n\n` +
        `This agent writes files and runs xppc. It has no symbol index, no generator ` +
        `and no knowledge base — search, object info, generation and validation all live ` +
        `on the hosted server.`,
      );

    default:
      return text(`Unknown tool '${name}'. This agent publishes: ${TOOLS.map(t => t.name).join(', ')}.`, true);
  }
}

const server = new Server({ name: 'd365fo-agent', version: VERSION }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    return await handle(req.params.name, (req.params.arguments ?? {}) as Record<string, unknown>);
  } catch (e) {
    // Never let a handler throw across the transport: the client sees a dead
    // server rather than a message it can act on.
    return text(`${e instanceof Error ? e.message : String(e)}`, true);
  }
});

await server.connect(new StdioServerTransport());
console.error(`[d365fo-agent] v${VERSION} ready — ${TOOLS.length} tools, write-only`);
