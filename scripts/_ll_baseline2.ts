/**
 * Step-1 baseline test driver #2 — TEMP, safe to delete.
 * (a) repair the broken Ex_LL_TestForm via modify (classDeclaration + datasource)
 * (b) generate SSRS report (crown jewel)
 * (c) rebuild, per-object diagnostics.
 */
import { Client }               from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ListRootsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

const SERVER = 'C:\\Users\\localadmin\\Documents\\New folder\\d365fo-mcp-server\\dist\\index.js';
const PROJECT_FOLDER = 'C:\\Repo\\Local-Sassine\\Projects\\Ex_LL_Test\\Ex_LL_Test';
const PROJECT_PATH = PROJECT_FOLDER + '\\Ex_LL_Test.rnrproj';
const MODEL = 'Ex_Test1';
const PKG = 'C:\\AOSService\\PackagesLocalDirectory';
const FORM_PATH = PKG + '\\Ex_Test1\\Ex_Test1\\AxForm\\Ex_LL_TestForm.xml';

function toFileUri(p: string): string { return 'file:///' + p.replace(/\\/g, '/'); }
let currentRoots: string[] = [PROJECT_FOLDER];

const transport = new StdioClientTransport({
  command: 'node', args: [SERVER],
  env: { ...(process.env as Record<string,string>), MCP_SERVER_MODE: 'full', DEBUG_LOGGING: 'false' },
  stderr: 'pipe',
});
transport.stderr?.on('data', (c: Buffer) => process.stderr.write(c));

const client = new Client({ name: 'baseline2', version: '1.0.0' }, { capabilities: { roots: { listChanged: true } } });
client.setRequestHandler(ListRootsRequestSchema, async () => ({ roots: currentRoots.map(p => ({ uri: toFileUri(p), name: p })) }));

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const textOf = (r: any): string => (r.content as Array<{type:string;text:string}>).filter(c=>c.type==='text').map(c=>c.text).join('\n');
async function call(name: string, args: any) {
  try { const r: any = await client.callTool({ name, arguments: args }); return { isError: !!r.isError, text: textOf(r) }; }
  catch (e: any) { return { isError: true, text: 'THROW: ' + (e?.message ?? String(e)) }; }
}
function banner(t: string) { console.log('\n' + '='.repeat(72) + '\n  ' + t + '\n' + '='.repeat(72)); }
async function step(label: string, name: string, args: any) {
  banner(label); const r = await call(name, args);
  console.log(`isError=${r.isError}`); console.log(r.text.split('\n').slice(0, 20).join('\n')); return r;
}
const common = { modelName: MODEL, packagePath: PKG, projectPath: PROJECT_PATH, solutionPath: PROJECT_FOLDER };

async function main() {
  console.log('Connecting (full mode)…');
  await client.connect(transport);
  console.log('Warming up (25s)…'); await wait(25000);

  // (a) Repair form: add classDeclaration method, then add datasource
  await step('MODIFY form: add classDeclaration', 'd365fo_file', {
    action: 'modify', objectType: 'form', objectName: 'Ex_LL_TestForm', filePath: FORM_PATH, ...common,
    operation: 'add-method',
    params: { methodName: 'classDeclaration', sourceCode: '[Form]\npublic class Ex_LL_TestForm extends FormRun\n{\n}' },
  });
  await step('MODIFY form: add data source', 'd365fo_file', {
    action: 'modify', objectType: 'form', objectName: 'Ex_LL_TestForm', filePath: FORM_PATH, ...common,
    operation: 'add-data-source',
    params: { dataSourceName: 'Ex_LL_TestBooking', dataSourceTable: 'Ex_LL_TestBooking' },
  });

  // (b) SSRS report (crown jewel)
  await step('GENERATE smart report Ex_LL_TestReport', 'generate_smart_report', {
    name: 'LL_TestReport', caption: 'LL Test Report',
    fieldsHint: 'BookingId, Description, Amount',
    contractParams: [{ name: 'FromDate', type: 'TransDate', mandatory: true }],
    ...common,
  });

  // (c) Rebuild
  const b = await step('BUILD Ex_Test1 (incremental)', 'build_d365fo_project', { modelName: MODEL, wait: true, waitTimeoutMs: 600000 });
  console.log('\n----- FULL BUILD OUTPUT -----\n' + b.text);

  await client.close();
  process.exit(0);
}
main().catch((err) => { console.error('DRIVER FATAL:', err); process.exit(1); });
