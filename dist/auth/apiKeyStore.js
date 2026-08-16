/**
 * Per-customer API key resolution.
 *
 * The single shared `API_KEY` env var cannot support customers: it cannot be
 * revoked for one caller without breaking every caller, and it makes every
 * request anonymous, so there is nothing to meter or rate-limit per tenant.
 * This store resolves a presented key to a named customer against Neon, which
 * is already the deployment's database.
 *
 * Both mechanisms stay live. `API_KEY` continues to work as an operator/root
 * key — local development, the smoke tests, and break-glass access all depend
 * on a key that works with no database — while customer keys come from the
 * table. See `resolveApiKey` for the order.
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Pool } from 'pg';
import { readNeonConfig } from '../metadata/neon/neonConfig.js';
/**
 * How long a lookup result is trusted before Neon is consulted again.
 *
 * This is the revocation delay: a key revoked in the table keeps working for up
 * to this long on an already-warm instance. 60 s trades a bounded exposure
 * window against a database round trip on every single MCP call. Set
 * API_KEY_CACHE_TTL_MS=0 to disable caching where immediate revocation matters
 * more than latency.
 */
const CACHE_TTL_MS = Number(process.env.API_KEY_CACHE_TTL_MS ?? 60_000);
/**
 * Rejections are cached far more briefly than acceptances. Caching a miss at all
 * is what stops a wrong key from becoming an unbounded stream of database
 * queries, but caching it for long would let a key that was just issued appear
 * broken to the customer who was handed it.
 */
const NEGATIVE_TTL_MS = Math.min(CACHE_TTL_MS, 10_000);
/** Minimum gap between `last_used_at` writes for one key. */
const LAST_USED_THROTTLE_MS = 5 * 60_000;
const cache = new Map();
const lastUsedWrittenAt = new Map();
let pool = null;
let poolChecked = false;
/**
 * The key store's own connection pool, separate from the search backend's.
 *
 * Deliberately tiny: auth queries are single-row primary-key lookups served
 * mostly from cache, so one or two connections is ample, and Neon bills on
 * connection lifetime. Total connections per instance = search pool
 * (NEON_POOL_MAX, default 5) + this.
 */
function getPool() {
    if (poolChecked)
        return pool;
    poolChecked = true;
    const cfg = readNeonConfig();
    if (!cfg)
        return null;
    pool = new Pool({ connectionString: cfg.connectionString, max: 2 });
    // Without a listener, a dropped idle client (Neon autosuspend closing the
    // connection) is an unhandled 'error' event, which takes the process down.
    pool.on('error', () => { });
    return pool;
}
/** Is a customer key store available at all? */
export function keyStoreConfigured() {
    return getPool() !== null;
}
export function hashKey(key) {
    return createHash('sha256').update(key, 'utf8').digest('hex');
}
/** Generate a new key. 256 bits of CSPRNG, hex-encoded. */
export function generateKey() {
    return randomBytes(32).toString('hex');
}
async function lookup(hash) {
    const p = getPool();
    if (!p)
        return null;
    const { rows } = await p.query(`SELECT customer FROM tenancy.api_keys WHERE key_hash = $1 AND status = 'active'`, [hash]);
    if (rows.length === 0)
        return null;
    return { customer: rows[0].customer, isRoot: false };
}
/** Advance last_used_at, throttled, never blocking the request. */
function touch(hash) {
    const now = Date.now();
    const previous = lastUsedWrittenAt.get(hash) ?? 0;
    if (now - previous < LAST_USED_THROTTLE_MS)
        return;
    lastUsedWrittenAt.set(hash, now);
    const p = getPool();
    if (!p)
        return;
    void p
        .query(`UPDATE tenancy.api_keys SET last_used_at = now() WHERE key_hash = $1`, [hash])
        // A failed usage-timestamp write must never fail the request it belongs to.
        .catch(() => { });
}
/**
 * Resolve a presented key, or null if it is not valid.
 *
 * The env `API_KEY` is checked first and without a database, so the operator key
 * keeps working when Neon is unreachable — otherwise a database outage would
 * lock out the very access needed to diagnose it.
 */
export async function resolveApiKey(presented) {
    const rootKey = process.env.API_KEY?.trim();
    if (rootKey && presented.length === rootKey.length) {
        // Length is compared first so timingSafeEqual is never handed mismatched
        // buffers (it throws). Length is already observable, so this leaks nothing
        // a response-time measurement would not.
        if (timingSafeEqual(Buffer.from(presented, 'utf8'), Buffer.from(rootKey, 'utf8'))) {
            return { customer: '(root)', isRoot: true };
        }
    }
    if (!keyStoreConfigured())
        return null;
    const hash = hashKey(presented);
    const hit = cache.get(hash);
    if (hit && hit.expiresAt > Date.now()) {
        if (hit.principal)
            touch(hash);
        return hit.principal;
    }
    let principal;
    try {
        principal = await lookup(hash);
    }
    catch {
        // Fail CLOSED. A database error must not become a free pass; the root key
        // above is the deliberate exception that keeps the server reachable.
        return null;
    }
    cache.set(hash, {
        principal,
        expiresAt: Date.now() + (principal ? CACHE_TTL_MS : NEGATIVE_TTL_MS),
    });
    if (principal)
        touch(hash);
    return principal;
}
/** Drop cached decisions. Used by tests and after issuing/revoking in-process. */
export function clearKeyCache() {
    cache.clear();
    lastUsedWrittenAt.clear();
}
/** Release the pool so a process can exit without waiting on Neon. */
export async function closeKeyStore() {
    const p = pool;
    pool = null;
    poolChecked = false;
    if (p)
        await p.end();
}
//# sourceMappingURL=apiKeyStore.js.map