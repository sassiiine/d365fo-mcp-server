/**
 * "What base type is this EDT?" - answered from Neon, in the cloud.
 *
 * The symbols index cannot answer this: it stores an EDT's Extends but not its
 * declared `i:type`, and the Extends chain bottoms out on names that are not
 * themselves indexed. arch_a.edt_types is backfilled from the AxEdt XML by
 * scripts/backfill-edt-types.ts precisely so this question has an answer without
 * any local metadata.
 */
import { Pool } from 'pg';
import { readNeonConfig } from '../metadata/neon/neonConfig.js';

/** Narrow seam so rules can be tested without a database. */
export interface EdtTypeLookup {
  /** Lower-case base type ('string' | 'real' | 'date' | 'enum' | …), or null if unknown. */
  baseTypeOf(edtName: string): Promise<string | null>;
}

/** Test/offline implementation over a plain map. */
export class StaticEdtTypes implements EdtTypeLookup {
  private readonly map: Map<string, string>;
  constructor(entries: Record<string, string>) {
    this.map = new Map(Object.entries(entries).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()]));
  }
  async baseTypeOf(name: string): Promise<string | null> {
    return this.map.get(name.toLowerCase()) ?? null;
  }
}

export class NeonEdtTypes implements EdtTypeLookup {
  private readonly pool: Pool;
  // EDT base types are static between backfills, so an unbounded per-process
  // cache is correct here - there are only ~24k of them and a validation pass
  // hits the same handful repeatedly.
  private readonly cache = new Map<string, string | null>();

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 2 });
    this.pool.on('error', () => { /* pg reconnects on demand */ });
  }

  async baseTypeOf(name: string): Promise<string | null> {
    const key = name.toLowerCase();
    const hit = this.cache.get(key);
    if (hit !== undefined) return hit;
    try {
      const { rows } = await this.pool.query<{ base_type: string }>(
        `SELECT base_type FROM arch_a.edt_types WHERE name_lower = $1`,
        [key],
      );
      const v = rows[0]?.base_type ?? null;
      this.cache.set(key, v);
      return v;
    } catch {
      // Unknown, not invalid. Rules treat null as "cannot judge" and stay quiet,
      // so a database blip produces no findings rather than false accusations.
      return null;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

/** Neon-backed lookup when configured, otherwise null (validation degrades). */
export function makeEdtTypeLookup(): EdtTypeLookup | null {
  const cfg = readNeonConfig();
  return cfg ? new NeonEdtTypes(cfg.connectionString) : null;
}
