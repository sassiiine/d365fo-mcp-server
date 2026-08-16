/** Narrow seam so rules can be tested without a database. */
export interface EdtTypeLookup {
    /** Lower-case base type ('string' | 'real' | 'date' | 'enum' | …), or null if unknown. */
    baseTypeOf(edtName: string): Promise<string | null>;
}
/** Test/offline implementation over a plain map. */
export declare class StaticEdtTypes implements EdtTypeLookup {
    private readonly map;
    constructor(entries: Record<string, string>);
    baseTypeOf(name: string): Promise<string | null>;
}
export declare class NeonEdtTypes implements EdtTypeLookup {
    private readonly pool;
    private readonly cache;
    constructor(connectionString: string);
    baseTypeOf(name: string): Promise<string | null>;
    close(): Promise<void>;
}
/** Neon-backed lookup when configured, otherwise null (validation degrades). */
export declare function makeEdtTypeLookup(): EdtTypeLookup | null;
/** Everything the backfill recorded about one EDT. */
export interface EdtTypeRecord {
    name: string;
    baseType: string;
    extends: string | null;
    model: string | null;
}
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
export declare function describeEdt(name: string): Promise<EdtTypeRecord | null>;
//# sourceMappingURL=edtTypeLookup.d.ts.map