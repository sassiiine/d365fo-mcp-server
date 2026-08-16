/**
 * `d365fo-mcp onboard --api-key <key>` — connect this machine to the hosted server.
 *
 * Replaces a PowerShell script invoked through an interpolated global-install
 * path, which was three moving parts a customer could get wrong before they had
 * done anything useful. One command, and the only thing they must supply is the
 * key that is theirs.
 *
 * Everything else is detected: the packages root by scanning volumes (the drive
 * letter varies by VM image), the model by AOT layer in each Descriptor
 * (Microsoft ships at layer 0, customer code sits at 14), and the agent from
 * this package's own location.
 */
import { promises as fs } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';

const HOSTED_URL = process.env.D365FO_CLOUD_URL ?? 'https://d365fo-mcp-282013198552.us-east5.run.app';

interface OnboardOptions {
  apiKey?: string;
  url?: string;
  model?: string;
  packagesPath?: string;
  config?: string;
}

const exists = (p: string) => fs.access(p).then(() => true, () => false);

/** PackagesLocalDirectory, wherever this image put it. */
async function findPackagesRoot(): Promise<string | null> {
  // Non-system drives first: on a Microsoft-provided VM the AOS volume is
  // almost never C:.
  const drives = ['K', 'J', 'D', 'E', 'F', 'I', 'C'];
  for (const d of drives) {
    const p = `${d}:\\AosService\\PackagesLocalDirectory`;
    if (await exists(p)) return p;
  }
  return null;
}

/** Custom models, identified by AOT layer rather than by name. */
async function findCustomModels(packages: string): Promise<string[]> {
  const out: string[] = [];
  let entries: string[];
  try { entries = await fs.readdir(packages); } catch { return out; }
  for (const name of entries) {
    try {
      const dir = join(packages, name, 'Descriptor');
      const files = await fs.readdir(dir);
      const xml = files.find(f => f.toLowerCase().endsWith('.xml'));
      if (!xml) continue;
      const head = (await fs.readFile(join(dir, xml), 'utf8')).slice(0, 2000);
      const layer = /<Layer>(\d+)<\/Layer>/.exec(head)?.[1];
      if (layer && layer !== '0') out.push(name);
    } catch { /* not a model package */ }
  }
  return out;
}

export async function onboardCommand(opts: OnboardOptions): Promise<void> {
  const apiKey = opts.apiKey ?? process.env.D365FO_API_KEY;
  if (!apiKey) {
    console.error('Missing --api-key. Your provider issues one key per customer; it is the only credential needed.');
    process.exitCode = 1;
    return;
  }

  const url = (opts.url ?? HOSTED_URL).replace(/\/+$/, '');
  // dist/cli/commands/onboard.js -> package root
  const agentEntry = resolve(dirname(fileURLToPath(import.meta.url)), '../../index.js');
  if (!(await exists(agentEntry))) {
    console.error(`Agent not found at ${agentEntry}. Reinstall the package.`);
    process.exitCode = 1;
    return;
  }

  console.log('Checking this machine');
  const major = Number(process.versions.node.split('.')[0]);
  if (major < 24) {
    console.error(`  Node ${process.versions.node} — 24 or newer is required.`);
    process.exitCode = 1;
    return;
  }
  console.log(`  node ${process.version}`);

  const packages = opts.packagesPath ?? (await findPackagesRoot());
  if (packages) {
    console.log(`  packages ${packages}`);
  } else {
    // Not fatal: a Unified Developer Experience box has no
    // AosService\PackagesLocalDirectory, and the agent can still be pointed at
    // one later. Saying so beats writing a config that silently targets nothing.
    console.log('  packages not found — set D365FO_PACKAGE_PATH afterwards (expected on UDE environments)');
  }

  let model = opts.model;
  if (!model && packages) {
    const models = await findCustomModels(packages);
    if (models.length === 1) {
      model = models[0];
      console.log(`  model ${model} (only custom model found)`);
    } else if (models.length > 1) {
      console.log(`  ${models.length} custom models: ${models.join(', ')}`);
      console.log('  none pinned — pass --model, or just tell the assistant which model to use');
    }
  }

  process.stdout.write('Checking the hosted server ... ');
  try {
    const res = await fetch(`${url}/health`, { signal: AbortSignal.timeout(30_000) });
    console.log(res.ok ? 'reachable' : `HTTP ${res.status}`);
    if (res.status === 403) {
      console.log('  403 means the host refused the caller before your key was seen — not a wrong key.');
    }
  } catch (e) {
    console.log(`unreachable (${e instanceof Error ? e.message : e})`);
    console.log('  Writing the config anyway; fix connectivity and restart your editor.');
  }

  const localEnv: Record<string, string> = { MCP_SERVER_MODE: 'write-only' };
  if (packages) localEnv.D365FO_PACKAGE_PATH = packages;
  if (model) { localEnv.D365FO_MODEL_NAME = model; localEnv.CUSTOM_MODELS = model; }

  const cfg = {
    servers: {
      'd365fo-local': { type: 'stdio', command: 'node', args: [agentEntry], env: localEnv },
      'd365fo-cloud': { type: 'http', url: `${url}/mcp`, headers: { 'X-Api-Key': apiKey } },
    },
  };

  const target = opts.config ?? join(process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'), 'Code', 'User', 'mcp.json');
  await fs.mkdir(dirname(target), { recursive: true });
  if (await exists(target)) {
    const backup = `${target}.bak`;
    await fs.copyFile(target, backup);
    console.log(`Backed up existing config to ${backup}`);
  }
  // UTF-8 WITHOUT a BOM: JSON parsers reject a BOM on the first character. (The
  // D365FO metadata this product writes needs the opposite — see
  // docs/customer-onboarding.md.)
  await fs.writeFile(target, JSON.stringify(cfg, null, 2), 'utf8');

  console.log('');
  console.log(`Wrote ${target}`);
  console.log('');
  console.log('Restart your editor. You should see two servers:');
  console.log('  d365fo-cloud  search, object info, knowledge, XML generation');
  console.log('  d365fo-local  writes files and runs the compiler on this machine');
  console.log('');
  console.log('The local one must NOT list search or get_knowledge — those only exist on the server.');
  console.log('Ask the assistant to create a model and it will; no scripts to run.');
}
