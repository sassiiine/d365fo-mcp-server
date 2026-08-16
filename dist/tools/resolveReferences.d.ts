/**
 * resolve_references — semantic reference resolver for generated X++ code.
 *
 * Anti-hallucination gate: extracts every external identifier from an X++
 * snippet and verifies it against the indexed codebase (symbols DB, labels DB,
 * extension_metadata, menu_item_targets). Nothing is assumed from training
 * data — a reference is either proven by the index or reported.
 *
 * Verified reference kinds:
 *   - Intrinsic functions: classStr/tableStr/fieldStr/enumStr/extendedTypeStr/
 *     formStr/queryStr/methodStr/menuItem*Str(...) — args are compile-time
 *     checked by the real X++ compiler, so they must exist in the index
 *   - Static member access  Type::member  (incl. arity check from signature)
 *   - Variable declarations TypeName varName — type must exist
 *   - Bound buffer access   buffer.Field / buffer.method() when the variable
 *     was declared in the snippet with a table/view type from the index
 *   - Label references      "@File:Id" and legacy "@SYS12345"
 *
 * Severity model (conservative — false blocks are worse than misses):
 *   error   — intrinsic target missing, static type/method missing,
 *             field missing on a confidently-bound table, arity mismatch,
 *             modern label id missing in a known label file
 *   warning — unknown declared type (kernel classes are not in metadata XML),
 *             instance method missing, legacy label not found,
 *             label file unknown (may be created later in the same task)
 */
import { z } from 'zod';
import type { XppServerContext } from '../types/context.js';
export declare const resolveReferencesArgsSchema: z.ZodObject<{
    code: z.ZodString;
    context: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export interface ReferenceViolation {
    kind: 'unknown-type' | 'unknown-static-member' | 'unknown-method' | 'unknown-field' | 'unknown-label' | 'unknown-intrinsic-target' | 'arity-mismatch';
    severity: 'error' | 'warning';
    line: number;
    identifier: string;
    detail: string;
}
export interface ResolveResult {
    violations: ReferenceViolation[];
    /** Count of references that were positively verified against the index */
    verifiedCount: number;
}
/** Minimal DB surface the resolver needs — satisfied by better-sqlite3. */
export interface ResolverDeps {
    db: {
        prepare(sql: string): {
            get(...params: unknown[]): unknown;
            all(...params: unknown[]): unknown[];
        };
    };
    getLabelById(labelId: string, labelFileId?: string): Array<{
        labelId: string;
        labelFileId: string;
    }>;
    getLabelFileIds(): Array<{
        labelFileId: string;
    }>;
}
export declare function resolveXppReferences(code: string, deps: ResolverDeps): ResolveResult;
/**
 * When GROUNDING_ENFORCE=true, run the resolver over X++ source about to be
 * written and reject the write if any ERROR-severity violation is found.
 * Returns null when the gate passes (disabled, no code, or clean).
 */
export declare function gateOnReferenceErrors(code: string | undefined, symbolIndex: {
    getReadDb(): ResolverDeps['db'];
    getLabelById: ResolverDeps['getLabelById'];
    getLabelFileIds: ResolverDeps['getLabelFileIds'];
} | undefined, operationDescription: string): {
    isError: true;
    content: [{
        type: 'text';
        text: string;
    }];
} | null;
export declare function resolveReferencesTool(request: {
    params: {
        arguments?: unknown;
    };
}, context: XppServerContext): Promise<{
    content: Array<{
        type: string;
        text: string;
    }>;
    isError?: boolean;
}>;
//# sourceMappingURL=resolveReferences.d.ts.map