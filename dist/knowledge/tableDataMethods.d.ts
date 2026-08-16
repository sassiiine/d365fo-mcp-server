/**
 * The data methods every table inherits from `xRecord` / `Common`.
 *
 * Those are kernel types with no AOT metadata, and the symbol index stores
 * declared members only, so a table's `validateWrite` has no row anywhere.
 * prepare(mode="change") and get_method both reported that as "not found",
 * which reads as "the method does not exist" for the most common CoC target
 * there is and leaves the caller to invent the wrapper unaided.
 *
 * The contract below is the part a green build cannot teach — above all that
 * the pre-image is `this.orig()`, already in memory, so re-reading the row by
 * its own RecId is a database round trip per write AND a different value: the
 * current stored state rather than what this buffer was fetched with.
 *
 * A FALLBACK only: consulted when neither index, bridge nor XML declares the
 * method, so a table that overrides `insert()` still reports its own signature.
 */
export interface TableDataMethod {
    /** Canonical AOT spelling. */
    name: string;
    /** The declaration a CoC wrapper has to match exactly. */
    signature: string;
    /** Kernel type that declares it. */
    declaredOn: 'xRecord' | 'Common';
    /** What wrapping it is for, in one line. */
    purpose: string;
    /** Non-negotiables a green build will not teach. */
    contract: string[];
}
/** Keyed by lower-cased method name. */
export declare const TABLE_DATA_METHODS: Record<string, TableDataMethod>;
/** The inherited data method by that name, or undefined. Case-insensitive, as X++ is. */
export declare function lookupTableDataMethod(methodName: string): TableDataMethod | undefined;
/**
 * True for the object types this fallback speaks for.
 *
 * Tables only, deliberately. Views, maps and data entities descend from `Common`
 * too, but they do not all wrap through `tableStr` and not every one of these
 * methods fires on them — a fallback that guessed there would be inventing a
 * signature, which is the failure it exists to prevent.
 */
export declare function hasTableDataMethods(objectType: string | undefined): boolean;
/** The `### Method signature` body when only this fallback knows the method. */
export declare function renderTableDataMethodSignature(method: TableDataMethod, objectName: string): string;
/** The `### CoC eligibility` body, plus the contract that is the reason this exists. */
export declare function renderTableDataMethodEligibility(method: TableDataMethod, objectName: string): string;
//# sourceMappingURL=tableDataMethods.d.ts.map