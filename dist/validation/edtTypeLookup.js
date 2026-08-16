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
/** Test/offline implementation over a plain map. */
export class StaticEdtTypes {
    map;
    constructor(entries) {
        this.map = new Map(Object.entries(entries).map(([k, v]) => [k.toLowerCase(), v.toLowerCase()]));
    }
    async baseTypeOf(name) {
        return this.map.get(name.toLowerCase()) ?? null;
    }
}
export class NeonEdtTypes {
    pool;
    // EDT base types are static between backfills, so an unbounded per-process
    // cache is correct here - there are only ~24k of them and a validation pass
    // hits the same handful repeatedly.
    cache = new Map();
    constructor(connectionString) {
        this.pool = new Pool({ connectionString, max: 2 });
        this.pool.on('error', () => { });
    }
    async baseTypeOf(name) {
        const key = name.toLowerCase();
        const hit = this.cache.get(key);
        if (hit !== undefined)
            return hit;
        try {
            const { rows } = await this.pool.query(`SELECT base_type FROM arch_a.edt_types WHERE name_lower = $1`, [key]);
            const v = rows[0]?.base_type ?? null;
            this.cache.set(key, v);
            return v;
        }
        catch {
            // Unknown, not invalid. Rules treat null as "cannot judge" and stay quiet,
            // so a database blip produces no findings rather than false accusations.
            return null;
        }
    }
    async close() {
        await this.pool.end();
    }
}
/** Neon-backed lookup when configured, otherwise null (validation degrades). */
export function makeEdtTypeLookup() {
    const cfg = readNeonConfig();
    return cfg ? new NeonEdtTypes(cfg.connectionString) : null;
}
let describePool;
/**
 * Full record for one EDT, for callers that want more than the base type.
 *
 * Exists because `get_object_info(objectType="edt")` had two sources - the C#
 * bridge and local SQLite - and on a cloud instance it has NEITHER, so it
 * answered "no data available" for EDTs that plainly exist (AmountMST among
 * them). arch_a.edt_types is a third source that works precisely where the other
 * two cannot.
 *
 * Returns null when Neon is unconfigured or the EDT is unknown; the caller still
 * distinguishes "no data" from "does not exist".
 */
export async function describeEdt(name) {
    if (describePool === undefined) {
        const cfg = readNeonConfig();
        describePool = cfg ? new Pool({ connectionString: cfg.connectionString, max: 2 }) : null;
        describePool?.on('error', () => { });
    }
    if (!describePool)
        return null;
    try {
        const { rows } = await describePool.query(`SELECT name, base_type, extends, model FROM arch_a.edt_types WHERE name_lower = $1`, [name.toLowerCase()]);
        const r = rows[0];
        return r ? { name: r.name, baseType: r.base_type, extends: r.extends, model: r.model } : null;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=edtTypeLookup.js.map