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
import { writeObject, resolveObjectPath } from './writeObject.js';
import { AOT_FOLDERS } from './aotFolders.js';

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
    name: 'get_workspace_info',
    description: 'Report the paths and model this agent is configured with, and what it can and cannot do.',
    inputSchema: { type: 'object', properties: {} },
  },
];

const text = (s: string, isError = false) => ({ content: [{ type: 'text', text: s }], ...(isError ? { isError: true } : {}) });

/**
 * NOT YET PORTED - deliberately refuses rather than guessing.
 *
 * A first attempt here hand-rolled the xppc invocation and got it wrong in ways
 * that would have produced builds that LIE: it passed `-metadata` without
 * `-compilermetadata`, inverted `-incremental` (a full build OMITS the flag),
 * used `-xmlLog` where xppc wants `-log`, looked for xppc.exe under the custom
 * packages root instead of the Microsoft one, and skipped label compilation
 * entirely - which makes correct source report BPErrorUnknownLabel.
 *
 * A build tool that reports success incorrectly is worse than no build tool, so
 * this returns an error until src/tools/sdlc/buildProject.ts is extracted into a
 * lean module. That extraction is small in principle (arguments, labelc, spawn,
 * wait) and the only thing it must shed is the knowledge-base import used to
 * enrich diagnostics - which belongs on the hosted server anyway, since
 * explaining a compiler error is exactly the kind of work worth hosting.
 */
async function runBuild(_modelName: string, _fullBuild: boolean): Promise<string> {
  return (
    'Build is not available in the thin agent yet.\n\n' +
    'Use the full package for builds until the compiler invocation is extracted:\n' +
    '  npm i -g github:sassiiine/d365fo-mcp-server\n' +
    'and run it with MCP_SERVER_MODE=write-only.\n\n' +
    'Writing objects through this agent works and is unaffected.'
  );
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
      const log = await runBuild(model, full);
      const failed = /error|exit [1-9]/i.test(log);
      return text(
        `${failed ? 'BUILD FAILED' : 'Build finished'} — ${model}, ${full ? 'FULL' : 'incremental'}\n` +
        (full ? '' : '\nIncremental: unchanged elements were not recompiled, so this proves nothing about the model as a whole. Re-run with fullBuild=true before calling the task done.\n') +
        `\n${log.slice(-6000)}`,
        failed,
      );
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
