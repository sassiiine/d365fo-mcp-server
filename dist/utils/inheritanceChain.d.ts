/**
 * Inheritance-chain helpers for method lookup.
 *
 * Every method reader probes the object the caller named: the bridge reads
 * `Classes.Read(name).Methods`, the XML path parses that one file, and SQLite
 * matches `parent_name = <name>`. All three see *declared* members only, so a
 * method the class inherits reports a false "not found" — the CoC path hits
 * this constantly, because the class worth wrapping is often a leaf whose
 * interesting methods live on a base class (SalesFormLetter_Invoice does not
 * declare `promptAndRun`; SalesFormLetter does).
 *
 * These helpers climb `symbols.extends_class` so a reader can retry against the
 * class that actually declares the method. SQLite is the locator (indexed,
 * sub-ms) and the bridge/XML stays the reader.
 */
import { type DbLike } from './symbolLookup.js';
/**
 * Ancestors of `name`, nearest first, in canonical (as-indexed) casing.
 * The class itself is not included. Returns [] when the object is unknown,
 * has no base, or the DB is unavailable.
 */
export declare function inheritanceAncestors(db: DbLike, name: string, maxDepth?: number): string[];
/**
 * Nearest ancestor of `className` that declares `methodName` according to the
 * symbol index, or undefined when no ancestor does (or the index doesn't know).
 *
 * `className` itself is not probed — callers have already tried it directly.
 *
 * Index-safe: `parent_name = ?` stays BINARY on idx_parent_type_name (the
 * ancestor names come back canonically cased from `inheritanceAncestors`), so
 * `COLLATE NOCASE` applies only inside one object's already-narrow member range.
 */
export declare function findDeclaringAncestor(db: DbLike, className: string, methodName: string): string | undefined;
/**
 * Owners to retry a failed method read against, nearest ancestor first.
 *
 * When the index knows which ancestor declares the method, that is the only
 * candidate — one extra read instead of a walk. Otherwise the answer depends on
 * how expensive a miss is: the bridge answers in-process, so probing the whole
 * chain is fine, but the XML path pays a file parse with a 3 s timeout per
 * level, so an unlocated method is not worth walking blindly.
 */
export declare function inheritedOwnerCandidates(db: DbLike, className: string, methodName: string, bridgeAvailable: boolean): string[];
//# sourceMappingURL=inheritanceChain.d.ts.map