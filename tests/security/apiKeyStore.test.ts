/**
 * Per-customer API key resolution.
 *
 * These run without Neon. `pg` is mocked, which is what lets the failure paths
 * be tested at all - a database that is down is exactly the case where getting
 * the answer wrong is most expensive, and it is not reproducible against a
 * healthy one.
 *
 * Every test uses a DISTINCT key. The store caches by key hash and advances
 * last_used_at as a fire-and-forget write, so a key reused across tests can be
 * answered from a previous test's cache entry and can leave an in-flight query
 * behind that lands after the next test has swapped the mock - which surfaces as
 * an unrelated test failing with the previous test's error.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const query = vi.fn();
vi.mock('pg', () => ({
  Pool: class {
    query = query;
    on = () => this;
    end = async () => {};
  },
}));

const ROOT = 'r'.repeat(64);
/** A unique key per test; see the file comment for why sharing one bites. */
let n = 0;
const freshKey = () => `k${n++}`.padEnd(64, '0');

async function load(env: { API_KEY?: string; NEON_DATABASE_URL?: string; API_KEY_CACHE_TTL_MS?: string }) {
  vi.resetModules();
  delete process.env.API_KEY;
  delete process.env.NEON_DATABASE_URL;
  delete process.env.DATABASE_URL;
  delete process.env.API_KEY_CACHE_TTL_MS;
  Object.assign(process.env, env);
  return import('../../src/auth/apiKeyStore.js');
}

const rows = (r: unknown[]) => ({ rows: r, rowCount: r.length });
const CONTOSO = [{ customer: 'Contoso' }];

beforeEach(() => {
  query.mockReset();
  // A default so a stray fire-and-forget UPDATE from any path resolves quietly
  // instead of becoming an unhandled rejection.
  query.mockResolvedValue(rows([]));
});
afterEach(() => {
  delete process.env.API_KEY;
  delete process.env.NEON_DATABASE_URL;
  delete process.env.API_KEY_CACHE_TTL_MS;
});

describe('resolveApiKey', () => {
  it('accepts the root env key without touching the database', async () => {
    const { resolveApiKey } = await load({ API_KEY: ROOT, NEON_DATABASE_URL: 'postgres://x' });
    expect(await resolveApiKey(ROOT)).toEqual({ customer: '(root)', isRoot: true });
    expect(query).not.toHaveBeenCalled();
  });

  it('resolves a customer key to its customer', async () => {
    query.mockResolvedValue(rows(CONTOSO));
    const { resolveApiKey } = await load({ NEON_DATABASE_URL: 'postgres://x' });
    expect(await resolveApiKey(freshKey())).toEqual({ customer: 'Contoso', isRoot: false });
  });

  it('never sends the plaintext key to the database', async () => {
    query.mockResolvedValue(rows(CONTOSO));
    const { resolveApiKey } = await load({ NEON_DATABASE_URL: 'postgres://x' });
    const key = freshKey();
    await resolveApiKey(key);
    const params = query.mock.calls.flatMap((c) => (c[1] as unknown[]) ?? []);
    expect(params).not.toContain(key);
    expect(params[0]).toMatch(/^[0-9a-f]{64}$/); // a SHA-256 digest, not the key
  });

  it('rejects an unknown key', async () => {
    const { resolveApiKey } = await load({ NEON_DATABASE_URL: 'postgres://x' });
    expect(await resolveApiKey(freshKey())).toBeNull();
  });

  it('fails CLOSED when the database errors', async () => {
    // The tempting alternative - letting requests through when the key store is
    // unreachable - turns a Neon outage into an open door on the index.
    query.mockImplementation(async () => { throw new Error('connection terminated'); });
    const { resolveApiKey } = await load({ NEON_DATABASE_URL: 'postgres://x' });
    expect(await resolveApiKey(freshKey())).toBeNull();
  });

  it('still honours the root key while the database is down', async () => {
    query.mockImplementation(async () => { throw new Error('connection terminated'); });
    const { resolveApiKey } = await load({ API_KEY: ROOT, NEON_DATABASE_URL: 'postgres://x' });
    expect(await resolveApiKey(ROOT)).toEqual({ customer: '(root)', isRoot: true });
  });

  it('rejects everything when no key source is configured', async () => {
    const { resolveApiKey, keyStoreConfigured } = await load({});
    expect(keyStoreConfigured()).toBe(false);
    expect(await resolveApiKey(freshKey())).toBeNull();
  });

  it('caches an accepted key instead of querying per request', async () => {
    query.mockResolvedValue(rows(CONTOSO));
    const { resolveApiKey } = await load({ NEON_DATABASE_URL: 'postgres://x' });
    const key = freshKey();
    await resolveApiKey(key);
    const afterFirst = query.mock.calls.length;
    await resolveApiKey(key);
    await resolveApiKey(key);
    expect(query.mock.calls.length).toBe(afterFirst);
  });

  it('sees a revocation once the cache expires', async () => {
    query.mockResolvedValue(rows(CONTOSO));
    const { resolveApiKey } = await load({ NEON_DATABASE_URL: 'postgres://x', API_KEY_CACHE_TTL_MS: '0' });
    const key = freshKey();
    expect(await resolveApiKey(key)).not.toBeNull();

    query.mockResolvedValue(rows([])); // revoked: no longer matches status='active'
    expect(await resolveApiKey(key)).toBeNull();
  });

  it('does not let a wrong key of root length pass as root', async () => {
    const { resolveApiKey } = await load({ API_KEY: ROOT, NEON_DATABASE_URL: 'postgres://x' });
    expect(await resolveApiKey('x'.repeat(ROOT.length))).toBeNull();
  });
});
