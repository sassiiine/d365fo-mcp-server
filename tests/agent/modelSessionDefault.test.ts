/**
 * The agent is driven as a real process over stdio, because the bug this covers
 * only exists in the wiring between two tool calls.
 *
 * `create_d365fo_model` used to leave D365FO_MODEL_NAME pointing at whatever it
 * pointed at before, so the very next `d365fo_file` wrote into the *previous*
 * model unless the agent repeated modelName on every call. The tool looked like
 * it created one model and then refused to move on. Asserting it through the
 * transport is the only way to prove the session actually carried the change:
 * `handle` is module-private and importing main.ts starts a server.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

let root: string;
let agent: ChildProcessWithoutNullStreams | null = null;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'agent-session-'));
  await mkdir(join(root, 'PackagesLocalDirectory'), { recursive: true });
});

afterEach(async () => {
  agent?.kill();
  agent = null;
  await rm(root, { recursive: true, force: true });
});

/** Newline-delimited JSON-RPC over the agent's stdio, one pending call at a time. */
function rpc(proc: ChildProcessWithoutNullStreams) {
  let buffer = '';
  const waiters = new Map<number, (msg: Record<string, unknown>) => void>();

  proc.stdout.on('data', (chunk: Buffer) => {
    buffer += chunk.toString('utf8');
    let nl: number;
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim();
      buffer = buffer.slice(nl + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line) as { id?: number };
        if (typeof msg.id === 'number' && waiters.has(msg.id)) {
          waiters.get(msg.id)!(msg as Record<string, unknown>);
          waiters.delete(msg.id);
        }
      } catch { /* not a complete JSON line; ignore */ }
    }
  });

  let nextId = 1;
  return {
    notify(method: string, params: unknown = {}) {
      proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method, params }) + '\n');
    },
    call(method: string, params: unknown): Promise<Record<string, unknown>> {
      const id = nextId++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`timed out: ${method}`)), 20_000);
        waiters.set(id, (msg) => { clearTimeout(timer); resolve(msg); });
        proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n');
      });
    },
  };
}

const textOf = (res: Record<string, unknown>): string => {
  const result = res.result as { content?: Array<{ text?: string }> } | undefined;
  return (result?.content ?? []).map((c) => c.text ?? '').join('\n');
};

describe('create_d365fo_model makes the new model the session default', () => {
  it('switches D365FO_MODEL_NAME so the next write lands in the model just created', async () => {
    agent = spawn(process.execPath, ['--import', 'tsx', 'src/agent/main.ts'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        D365FO_PACKAGE_PATH: join(root, 'PackagesLocalDirectory'),
        D365FO_MODEL_NAME: 'Ex_Old_Model',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const client = rpc(agent);
    await client.call('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '0' },
    });
    client.notify('notifications/initialized');

    // Before: the agent is pinned to the model it was started with.
    expect(textOf(await client.call('tools/call', {
      name: 'get_workspace_info', arguments: {},
    }))).toContain('Ex_Old_Model');

    const created = textOf(await client.call('tools/call', {
      name: 'create_d365fo_model', arguments: { modelName: 'Ex_New_Model' },
    }));
    expect(created).toMatch(/Created model Ex_New_Model/);
    expect(created).toMatch(/default model for this session/i);

    // After: the model just created is what the following calls will use.
    const after = textOf(await client.call('tools/call', {
      name: 'get_workspace_info', arguments: {},
    }));
    expect(after).toContain('Ex_New_Model');
    expect(after).not.toContain('Ex_Old_Model');
  }, 45_000);

  it('reports an existing model instead of failing the run', async () => {
    agent = spawn(process.execPath, ['--import', 'tsx', 'src/agent/main.ts'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        D365FO_PACKAGE_PATH: join(root, 'PackagesLocalDirectory'),
        D365FO_MODEL_NAME: 'Ex_Old_Model',
      },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    const client = rpc(agent);
    await client.call('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test', version: '0' },
    });
    client.notify('notifications/initialized');

    const args = { name: 'create_d365fo_model', arguments: { modelName: 'Ex_Retry_Model' } };
    expect(textOf(await client.call('tools/call', args))).toMatch(/Created model/);

    // The retry an agent makes after a failure partway through its objects.
    const second = await client.call('tools/call', args);
    expect((second.result as { isError?: boolean }).isError).toBeFalsy();
    expect(textOf(second)).toMatch(/Model already exists Ex_Retry_Model/);
  }, 45_000);
});
