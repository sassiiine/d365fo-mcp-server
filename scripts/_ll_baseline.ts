/**
 * Step-1 baseline test driver (full mode, bridge live). TEMP — safe to delete.
 * generate -> bridge Create() -> xppc compile, on real Ex_LL_* custom-model objects.
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
  command: 'node',
  args: [SERVER],
  env: { ...(process.env as Record<string,string>), MCP_SERVER_MODE: 'full', DEBUG_LOGGING: 'false' },
  stderr: 'pipe',
});
transport.stderr?.on('data', (c: Buffer) => process.stderr.write(c));

const client = new Client({ name: 'baseline-driver', version: '1.0.0' }, { capabilities: { roots: { listChanged: true } } });
client.setRequestHandler(ListRootsRequestSchema, async () => ({
  roots: currentRoots.map(p => ({ uri: toFileUri(p), name: p })),
}));

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

function textOf(result: any): string {
  return (result.content as Array<{type:string;text:string}>).filter(c=>c.type==='text').map(c=>c.text).join('\n');
}

async function call(name: string, args: any): Promise<{ isError: boolean; text: string }> {
  try {
    const r: any = await client.callTool({ name, arguments: args });
    return { isError: !!r.isError, text: textOf(r) };
  } catch (e: any) {
    return { isError: true, text: 'THROW: ' + (e?.message ?? String(e)) };
  }
}

function banner(t: string) { console.log('\n' + '='.repeat(72) + '\n  ' + t + '\n' + '='.repeat(72)); }

const results: Array<{ step: string; isError: boolean; head: string }> = [];
async function step(label: string, name: string, args: any) {
  banner(label);
  const r = await call(name, args);
  const head = r.text.split('\n').slice(0, 14).join('\n');
  console.log(`isError=${r.isError}`);
  console.log(head);
  results.push({ step: label, isError: r.isError, head: r.text.split('\n').slice(0,4).join(' | ') });
  return r;
}

const common = { modelName: MODEL, packagePath: PKG, projectPath: PROJECT_PATH, solutionPath: PROJECT_FOLDER };

async function main() {
  console.log('Connecting (full mode)…');
  await client.connect(transport);
  console.log('Connected. Warming up bridge (25s)…');
  await wait(25000);

  await step('workspace info', 'get_workspace_info', {});

  await step('CREATE enum Ex_LL_TestStatus', 'd365fo_file', {
    action: 'create', objectType: 'enum', objectName: 'LL_TestStatus', ...common,
    properties: { label: 'LL Test Status', enumValues: [
      { name: 'Draft', value: 0, label: 'Draft' },
      { name: 'Active', value: 1, label: 'Active' },
      { name: 'Closed', value: 2, label: 'Closed' },
    ] },
  });

  await step('CREATE edt Ex_LL_TestId', 'd365fo_file', {
    action: 'create', objectType: 'edt', objectName: 'LL_TestId', ...common,
    properties: { label: 'LL Test Id', edtType: 'String', stringSize: 20 },
  });

  await step('CREATE table Ex_LL_TestBooking', 'd365fo_file', {
    action: 'create', objectType: 'table', objectName: 'LL_TestBooking', ...common,
    properties: {
      label: 'LL Test Booking', tableGroup: 'Main', titleField1: 'BookingId',
      fields: [
        { name: 'BookingId', edt: 'Ex_LL_TestId', label: 'Booking Id', mandatory: true },
        { name: 'Description', edt: 'Description', label: 'Description' },
        { name: 'Status', enumType: 'Ex_LL_TestStatus', fieldType: 'AxTableFieldEnum', label: 'Status' },
      ],
    },
  });

  await step('CREATE form Ex_LL_TestForm', 'd365fo_file', {
    action: 'create', objectType: 'form', objectName: 'LL_TestForm', ...common,
    properties: { caption: 'LL Test Form', formTemplate: 'SimpleList', dataSource: 'Ex_LL_TestBooking' },
  });

  await step('CREATE class Ex_LL_TestManager', 'd365fo_file', {
    action: 'create', objectType: 'class', objectName: 'LL_TestManager', ...common,
    sourceCode: 'public class Ex_LL_TestManager\n{\n}\n\npublic static void main(Args _args)\n{\n    info("Ex_LL_TestManager ran");\n}',
    properties: { isFinal: false },
  });

  const b = await step('BUILD Ex_Test1 (incremental)', 'build_d365fo_project', {
    modelName: MODEL, wait: true, waitTimeoutMs: 600000,
  });
  console.log('\n----- FULL BUILD OUTPUT -----\n' + b.text);

  banner('SUMMARY');
  for (const r of results) console.log(`${r.isError ? 'FAIL' : 'ok  '}  ${r.step}  ::  ${r.head}`);

  await client.close();
  process.exit(0);
}

main().catch((err) => { console.error('DRIVER FATAL:', err); process.exit(1); });
