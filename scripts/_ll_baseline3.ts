/**
 * Step-1 baseline test driver #3 — TEMP, safe to delete.
 * SSRS report (crown jewel) via generate_object scaffold, then build-poll to final.
 */
import { Client }               from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListRootsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const SERVER = 'C:\\Users\\localadmin\\Documents\\New folder\\d365fo-mcp-server\\dist\\index.js';
const PROJECT_FOLDER = 'C:\\Repo\\Local-Sassine\\Projects\\Ex_LL_Test\\Ex_LL_Test';
const PROJECT_PATH = PROJECT_FOLDER + '\\Ex_LL_Test.rnrproj';
const MODEL = 'Ex_Test1';
const PKG = 'C:\\AOSService\\PackagesLocalDirectory';

function toFileUri(p: string): string { return 'file:///' + p.replace(/\\/g, '/'); }
let currentRoots: string[] = [PROJECT_FOLDER];
const transport = new StdioClientTransport({
  command: 'node', args: [SERVER],
  env: { ...(process.env as Record<string,string>), MCP_SERVER_MODE: 'full', DEBUG_LOGGING: 'false' },
  stderr: 'pipe',
});
transport.stderr?.on('data', (c: Buffer) => process.stderr.write(c));
const client = new Client({ name: 'baseline3', version: '1.0.0' }, { capabilities: { roots: { listChanged: true } } });
client.setRequestHandler(ListRootsRequestSchema, async () => ({ roots: currentRoots.map(p => ({ uri: toFileUri(p), name: p })) }));

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const textOf = (r: any): string => (r.content as Array<{type:string;text:string}>).filter(c=>c.type==='text').map(c=>c.text).join('\n');
async function call(name: string, args: any) {
  try { const r: any = await client.callTool({ name, arguments: args }); return { isError: !!r.isError, text: textOf(r) }; }
  catch (e: any) { return { isError: true, text: 'THROW: ' + (e?.message ?? String(e)) }; }
}
function banner(t: string) { console.log('\n' + '='.repeat(72) + '\n  ' + t + '\n' + '='.repeat(72)); }
const common = { modelName: MODEL, packagePath: PKG, projectPath: PROJECT_PATH, solutionPath: PROJECT_FOLDER };

async function buildUntilDone() {
  let last = '';
  for (let i = 0; i < 15; i++) {
    const r = await call('build_d365fo_project', { modelName: MODEL, wait: true, waitTimeoutMs: 120000 });
    last = r.text;
    if (!/still running/i.test(r.text)) { console.log(`(build settled after ${i + 1} poll(s))`); return r; }
    console.log(`  …build still running, poll ${i + 1}, waiting 20s`);
    await wait(20000);
  }
  return { isError: true, text: last };
}

async function main() {
  console.log('Connecting (full mode)…');
  await client.connect(transport);
  console.log('Warming up (25s)…'); await wait(25000);

  banner('GENERATE report Ex_LL_TestReport (generate_object scaffold)');
  const g = await call('generate_object', {
    mode: 'scaffold', objectType: 'report', name: 'LL_TestReport', caption: 'LL Test Report',
    fieldsHint: 'BookingId, Description, Amount',
    contractParams: [{ name: 'FromDate', type: 'TransDate', mandatory: true }],
    generateController: true, ...common,
  });
  console.log(`isError=${g.isError}`);
  console.log(g.text.split('\n').slice(0, 40).join('\n'));

  banner('BUILD Ex_Test1 → final');
  const b = await buildUntilDone();
  console.log(`isError=${b.isError}`);
  // print the diagnostics + final Errors/Warnings lines
  const lines = b.text.split('\n');
  console.log(lines.slice(0, 30).join('\n'));
  const tail = lines.filter(l => /Errors:|Warnings:|Compile Error|🔴|classDeclaration|completed/.test(l));
  console.log('\n--- key lines ---\n' + tail.join('\n'));

  await client.close();
  process.exit(0);
}
main().catch((err) => { console.error('DRIVER FATAL:', err); process.exit(1); });
