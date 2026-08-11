/**
 * Light smoke test for the Neon index backend. Runs a HANDFUL of real queries
 * against Neon via NeonSymbolIndex and prints the results — enough to prove the
 * adapter is wired correctly without burning compute.
 *
 *   NEON_DATABASE_URL="postgres://...pooler.../neondb?sslmode=require" \
 *   npx tsx scripts/neon-smoke.mts
 */
import { readNeonConfig } from '../src/metadata/neon/neonConfig.js';
import { NeonSymbolIndex } from '../src/metadata/neon/neonSymbolIndex.js';

const cfg = readNeonConfig();
if (!cfg) {
  console.error('NEON_DATABASE_URL (or DATABASE_URL) is not set.');
  process.exit(1);
}

const idx = new NeonSymbolIndex(cfg);
try {
  console.log(`schema=${cfg.schema}  total symbols=${await idx.getSymbolCount()}`);

  const custTable = await idx.searchSymbols('CustTable', 5);
  console.log(`searchSymbols("CustTable") -> ${custTable.length}: ${custTable.map((s) => `${s.name}[${s.type}]`).join(', ')}`);

  const postMethods = await idx.searchSymbols('post', 5, ['method']);
  console.log(`searchSymbols("post", type=method) -> ${postMethods.length}: ${postMethods.map((s) => s.name).join(', ')}`);

  const prefix = await idx.searchByPrefix('InventTrans', ['table'], 5);
  console.log(`searchByPrefix("InventTrans", type=table) -> ${prefix.length}: ${prefix.map((s) => s.name).join(', ')}`);

  const labels = await idx.searchLabels('customer', { limit: 3 });
  console.log(`searchLabels("customer") -> ${labels.length}: ${labels.map((l) => `${l.labelId}="${l.text}"`).join(' | ')}`);
} finally {
  await idx.close();
}
