/**
 * Find Method generator — `generate_object(mode="find-methods")`.
 *
 * Ports TRUDUtils "Create Find Method": generates the standard static
 * find()/findRecId()/exists() methods for a table, keyed on the table's primary
 * (unique) index. The method bodies follow Microsoft's shipped convention
 * (selectForUpdate guard, firstonly, key null-guard) so the output compiles and
 * matches BP expectations without manual rewriting.
 *
 * Data source priority mirrors tableInfo: C# bridge (authoritative — gives index
 * + EDT info) → explicit keyFields arg (DB-only environments, where index data
 * is not in the symbol index). Without either, findRecId()/exists-by-RecId are
 * still emitted (RecId always exists) and a note explains how to get key-based
 * finds.
 *
 * Output is text X++; the caller inserts it with d365fo_file(action="modify",
 * add-method) — these methods live on an EXISTING table, so no prefix applies.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
/** Minimal table shape the generator needs — decoupled from the bridge type. */
export interface FindMethodTableShape {
    name: string;
    /** Primary index name, when known (bridge.primaryIndex). */
    primaryIndex?: string;
    fields: Array<{
        name: string;
        extendedDataType?: string;
        fieldType?: string;
    }>;
    indexes: Array<{
        name: string;
        allowDuplicates: boolean;
        fields: string[];
    }>;
}
export interface FindMethodKeyField {
    /** Field name as declared on the table. */
    field: string;
    /** X++ parameter type — the field's EDT, else its base field type, else a safe default. */
    type: string;
}
/** lower-camelCase buffer variable name for a table, e.g. CustTable → custTable. */
export declare function bufferName(table: string): string;
/**
 * Resolve the key fields find()/exists() should select on. Preference:
 *   1. explicit override
 *   2. the declared primary index
 *   3. the first unique (allowDuplicates=false) index
 * Returns [] when no unique key can be determined.
 */
export declare function resolveKeyFields(table: FindMethodTableShape, override?: string[]): FindMethodKeyField[];
/**
 * Render find()/findRecId()/exists() for a table. Pure — unit-testable without
 * a bridge. When `keys` is empty, key-based find()/exists() are skipped and only
 * findRecId() (always valid via the system RecId field) is produced.
 */
export declare function buildFindMethods(table: FindMethodTableShape, keys: FindMethodKeyField[], opts?: {
    includeExists?: boolean;
    includeFindRecId?: boolean;
}): string;
export declare function generateFindMethodsTool(request: CallToolRequest, context: XppServerContext): Promise<{
    content: {
        type: 'text';
        text: string;
    }[];
    isError?: boolean | undefined;
}>;
//# sourceMappingURL=generateFindMethods.d.ts.map