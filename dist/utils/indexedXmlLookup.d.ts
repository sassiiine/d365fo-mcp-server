/**
 * Indexed-object XML lookup.
 *
 * Shared fallback path for the get_object_info readers: when the C# bridge returns
 * no data (bridge not connected, running without metadata access, or its DiskProvider
 * simply does not cover that package), the symbol index usually still knows the object
 * — `search` finds it. Reporting "not found" in that situation is wrong and has burned
 * agents repeatedly (see eval corpus: EDT "Bridge returned no data" while the same EDTs
 * resolved through search / validate_code).
 *
 * This module resolves an indexed object to a readable local XML string:
 *   1. symbol index row (case-insensitive, index-safe via lookupSymbolNocase)
 *   2. the indexed file path if it exists on this machine
 *   3. the same path remapped onto the configured packages root (the DB may store
 *      Azure DevOps build-agent paths)
 *   4. extracted-metadata JSON files, which wrap the XML in a `raw` property
 */
import { type BridgeReadinessSource } from '../bridge/bridgeReadiness.js';
export interface IndexedObjectRef {
    /** Canonical name as stored in the index (may differ in casing from the request). */
    name: string;
    model: string;
    /** Path recorded in the symbol index — may point at a build agent. */
    indexedPath: string | null;
    /** Readable path on this machine (indexed or remapped), null when unreachable. */
    localPath: string | null;
    /**
     * The index records a PackagesLocalDirectory path whose file is gone from BOTH
     * the recorded location and the local remap — the row outlived the object.
     *
     * Only set for PackagesLocalDirectory paths: a foreign build-agent path that
     * simply does not remap here is unreachable, not deleted, and must not be
     * reported as stale.
     */
    sourceFileMissing: boolean;
}
/** Look up a top-level object in the symbol index and resolve a readable local path. */
export declare function resolveIndexedObject(db: unknown, name: string, types: readonly string[], modelName?: string): Promise<IndexedObjectRef | null>;
/**
 * Read XML from a local file. Extracted-metadata JSON files wrap the original XML
 * in a `raw` property — unwrap those transparently. Returns null when unreadable.
 */
export declare function readXmlFile(filePath: string): Promise<string | null>;
/** Symbol-index lookup + XML read in one step. Returns null when either step fails. */
export declare function readIndexedXml(db: unknown, name: string, types: readonly string[], modelName?: string): Promise<{
    ref: IndexedObjectRef;
    xml: string;
} | null>;
/**
 * Standard footer for a reader that answered from the index instead of the bridge —
 * makes the provenance (and its limits) explicit to the agent.
 *
 * Pass `ref` whenever one is available so a row that outlived its file is called
 * out rather than rendered as fact — see `staleIndexNote`.
 */
export declare function indexedSourceNote(source: string, ref?: IndexedObjectRef | null): string;
/**
 * Warn when the answer came from a cache whose object is no longer on disk.
 *
 * The extracted-metadata JSON is written at index time and is NOT removed when the
 * AOT XML is deleted, so a reset workspace kept answering `get_object_info` with a
 * complete, confident enum — name, four values, four labels — for a file that did
 * not exist. The agent believed it (the bridge being quiet is normal for
 * not-yet-indexed objects), spent about a quarter of its run proving the object was
 * a ghost, and only then started the real work.
 *
 * The bridge disagreeing with the cache is the tell, and it is available right here:
 * bridge silent + PackagesLocalDirectory path + no file at either the recorded or
 * the remapped location means the row outlived the object.
 */
export declare function staleIndexNote(ref: IndexedObjectRef): string;
/**
 * Is this indexed path a row that outlived its file?
 *
 * For readers that hold a raw `file_path` from a symbol row rather than an
 * `IndexedObjectRef`. Literally the same rule — both go through
 * `isStaleIndexedPath`, so the two can never answer differently about one row.
 */
export declare function indexedPathIsMissing(indexedPath: string | null | undefined): Promise<boolean>;
/**
 * The same fact, told to a LIST rather than to a reader of one object.
 *
 * `renderStaleIndexNote` answers "you asked for this object and the cache answered
 * for it", so it can end in "treat it as NOT EXISTING and create it". A search
 * result set cannot say that. `indexedPathIsMissing` fires for any
 * PackagesLocalDirectory path with no file here, and the shipped symbol index covers
 * every standard package while a given machine installs a subset — so on a partial
 * install these rows are mostly "that package is not installed", not "deleted". Both
 * causes matter to the caller and neither justifies hiding the row (that would answer
 * "no such object" for most of D365FO, in the tool every other workflow starts from),
 * so name them and let the caller decide.
 */
export declare function renderStaleSearchRowsNote(count: number): string;
/** The per-row marker for a stale search hit — see renderStaleSearchRowsNote. */
export declare const STALE_ROW_MARKER = "\u26A0\uFE0F STALE index row \u2014 no file on this machine";
/** The warning text both stale-row paths render. */
export declare function renderStaleIndexNote(name: string, indexedPath: string): string;
/**
 * Explain why the bridge produced nothing, so "not found" is never mistaken for
 * "does not exist" when the bridge is simply unavailable.
 *
 * Takes the server context (not just `context.bridge`) so a bridge that is still
 * starting is reported as a cold-start race rather than as a broken config — the
 * conflation behind issue #826.
 */
export declare function bridgeUnavailableNote(context: BridgeReadinessSource | undefined): string;
//# sourceMappingURL=indexedXmlLookup.d.ts.map