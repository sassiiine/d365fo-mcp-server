/**
 * Issue, list and revoke per-customer API keys.
 *
 *   npm run keys -- list
 *   npm run keys -- issue "Contoso" --label "prod VM"
 *   npm run keys -- revoke "Contoso"
 *   npm run keys -- init          # create the tenancy schema
 *
 * Needs NEON_DATABASE_URL. The issued key is printed ONCE and is not recoverable
 * afterwards - only its SHA-256 digest is stored. That is the point: a leak of
 * the database is not a leak of the keys.
 */
import '../src/bootstrapEnv.js';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Pool } from 'pg';
import { generateKey, hashKey } from '../src/auth/apiKeyStore.js';
import { readNeonConfig } from '../src/metadata/neon/neonConfig.js';

const cfg = readNeonConfig();
if (!cfg) {
  console.error('NEON_DATABASE_URL is not set - there is no key store to manage.');
  process.exit(1);
}

const pool = new Pool({ connectionString: cfg.connectionString, max: 2 });
const [command, ...rest] = process.argv.slice(2);

function flag(name: string): string | undefined {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
}
const positional = rest.filter((a, i) => !a.startsWith('--') && !rest[i - 1]?.startsWith('--'));

try {
  switch (command) {
    case 'init': {
      const here = dirname(fileURLToPath(import.meta.url));
      const sql = await readFile(resolve(here, '../src/auth/schema.sql'), 'utf8');
      await pool.query(sql);
      console.log('tenancy.api_keys ready');
      break;
    }

    case 'issue': {
      const customer = positional[0];
      if (!customer) throw new Error('usage: issue <customer> [--label "..."]');
      const key = generateKey();
      await pool.query(
        `INSERT INTO tenancy.api_keys (key_hash, customer, label) VALUES ($1, $2, $3)`,
        [hashKey(key), customer, flag('label') ?? null],
      );
      console.log(`customer : ${customer}`);
      console.log(`key      : ${key}`);
      console.log('');
      console.log('Shown once. Store it now - it cannot be recovered, only replaced.');
      break;
    }

    case 'revoke': {
      const customer = positional[0];
      if (!customer) throw new Error('usage: revoke <customer>');
      // Revokes EVERY active key for the customer. Revoking one of several is
      // rare enough that a per-key flag would be more footgun than feature; if
      // it is ever needed, add --id using the value shown by `list`.
      const { rowCount } = await pool.query(
        `UPDATE tenancy.api_keys SET status = 'revoked', revoked_at = now()
          WHERE customer = $1 AND status = 'active'`,
        [customer],
      );
      console.log(`revoked ${rowCount} active key(s) for ${customer}`);
      if (rowCount) {
        console.log('Takes effect within API_KEY_CACHE_TTL_MS (default 60s) on warm instances.');
      }
      break;
    }

    case 'list': {
      const { rows } = await pool.query(
        `SELECT id, customer, label, status, created_at, revoked_at, last_used_at
           FROM tenancy.api_keys ORDER BY customer, created_at`,
      );
      if (rows.length === 0) { console.log('no keys issued'); break; }
      const fmt = (d: Date | null) => (d ? new Date(d).toISOString().slice(0, 16).replace('T', ' ') : '-');
      console.log('id   customer              status    created           last used');
      for (const r of rows) {
        console.log(
          `${String(r.id).padEnd(4)} ${String(r.customer).padEnd(21)} ${String(r.status).padEnd(9)} ` +
          `${fmt(r.created_at).padEnd(17)} ${fmt(r.last_used_at)}` + (r.label ? `   (${r.label})` : ''),
        );
      }
      break;
    }

    default:
      console.error('commands: init | issue <customer> [--label "..."] | revoke <customer> | list');
      process.exitCode = 1;
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
} finally {
  // Neon bills on connection lifetime, so never leave this hanging.
  await pool.end();
}
