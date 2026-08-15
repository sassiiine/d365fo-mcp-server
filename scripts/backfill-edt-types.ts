/**
 * Populate arch_a.edt_types from the AxEdt XML on this machine.
 *
 *   npm run backfill:edt-types                    # uses D365FO_PACKAGE_PATH
 *   npm run backfill:edt-types -- --dry-run
 *
 * Runs on a Windows dev VM (that is where the metadata is) and writes to Neon,
 * so afterwards the CLOUD can answer "what base type is this EDT" without any
 * local metadata. That single fact is what the table-field validation rule and
 * the EDT-aware generator both depend on.
 *
 * Re-runnable: rows are upserted by name, so a second run over a newer metadata
 * set refreshes in place.
 */
import '../src/bootstrapEnv.js';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { Pool } from 'pg';
import { readNeonConfig } from '../src/metadata/neon/neonConfig.js';

const dryRun = process.argv.includes('--dry-run');

const cfg = readNeonConfig();
if (!cfg && !dryRun) {
  console.error('NEON_DATABASE_URL is not set.');
  process.exit(1);
}

const packagesPath = process.env.D365FO_PACKAGE_PATH;
if (!packagesPath) {
  console.error('D365FO_PACKAGE_PATH is not set (path to PackagesLocalDirectory).');
  process.exit(1);
}

/** `i:type="AxEdtString"` -> `string`. */
const TYPE_RE = /i:type\s*=\s*"AxEdt([A-Za-z0-9]+)"/;
const EXTENDS_RE = /<Extends>([^<]+)<\/Extends>/;
const NAME_RE = /<Name>([^<]+)<\/Name>/;

interface EdtRow { name: string; baseType: string; extends: string | null; model: string }

async function* axEdtFiles(root: string): AsyncGenerator<{ path: string; model: string }> {
  // Layout is <packages>/<Package>/<Model>/AxEdt/*.xml. Walking the two known
  // levels rather than recursing the whole tree keeps this off the multi-GB
  // XppMetadata and bin directories that sit alongside.
  for (const pkg of await readdir(root, { withFileTypes: true })) {
    if (!pkg.isDirectory()) continue;
    let models: Awaited<ReturnType<typeof readdir>>;
    try { models = await readdir(join(root, pkg.name), { withFileTypes: true }); } catch { continue; }
    for (const model of models) {
      if (!model.isDirectory()) continue;
      const dir = join(root, pkg.name, model.name, 'AxEdt');
      let entries: string[];
      try { entries = await readdir(dir); } catch { continue; }
      for (const f of entries) {
        if (f.toLowerCase().endsWith('.xml')) yield { path: join(dir, f), model: model.name };
      }
    }
  }
}

const rows: EdtRow[] = [];
let scanned = 0;
let skipped = 0;

for await (const { path, model } of axEdtFiles(packagesPath)) {
  scanned++;
  let xml: string;
  try { xml = await readFile(path, 'utf8'); } catch { skipped++; continue; }
  // Only the head matters; EDT XML can carry long ArrayElements/Relations blocks.
  const head = xml.slice(0, 2000);
  const t = TYPE_RE.exec(head);
  const n = NAME_RE.exec(head);
  if (!t || !n) { skipped++; continue; }
  rows.push({
    name: n[1],
    baseType: t[1].toLowerCase(),
    extends: EXTENDS_RE.exec(head)?.[1] ?? null,
    model,
  });
}

const byType = rows.reduce<Record<string, number>>((a, r) => { a[r.baseType] = (a[r.baseType] ?? 0) + 1; return a; }, {});
console.log(`scanned ${scanned} AxEdt files, parsed ${rows.length}, skipped ${skipped}`);
console.log('base types:', Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}=${v}`).join(' '));

if (dryRun) { console.log('\n--dry-run: nothing written'); process.exit(0); }

const pool = new Pool({ connectionString: cfg!.connectionString, max: 2 });
try {
  const schema = await readFile(new URL('../src/validation/edtTypes.sql', import.meta.url), 'utf8');
  await pool.query(schema);

  // Batched multi-row upsert. One statement per row would be ~24k round trips to
  // Neon; batching keeps the connection open for seconds rather than minutes,
  // which is also what the CU bill tracks.
  const BATCH = 500;
  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const values: unknown[] = [];
    const tuples = batch.map((r, j) => {
      const b = j * 5;
      values.push(r.name.toLowerCase(), r.name, r.baseType, r.extends, r.model);
      return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5})`;
    });
    await pool.query(
      `INSERT INTO arch_a.edt_types (name_lower, name, base_type, extends, model)
       VALUES ${tuples.join(', ')}
       ON CONFLICT (name_lower) DO UPDATE
         SET name = EXCLUDED.name, base_type = EXCLUDED.base_type,
             extends = EXCLUDED.extends, model = EXCLUDED.model, updated_at = now()`,
      values,
    );
    written += batch.length;
  }
  console.log(`upserted ${written} rows into arch_a.edt_types`);
} finally {
  await pool.end();
}
