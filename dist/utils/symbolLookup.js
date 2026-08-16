/**
 * Index-safe case-insensitive symbol lookups.
 *
 * `name = ? COLLATE NOCASE` cannot use the BINARY-collated name indexes and
 * degrades to a scan of the 1.17M-row symbols table — 13–180 s on a
 * production-size DB with a cold file cache. node:sqlite is synchronous,
 * so that scan blocks the event loop until MCP clients time out and kill the
 * server.
 *
 * Pattern (proven in prepare, d93f004): exact-case probe on idx_name_type
 * (sub-ms) first, FTS5 phrase match (case-folded by the tokenizer) as the
 * fallback for differently-cased input. The FTS candidates are re-checked
 * with `COLLATE NOCASE`, so FTS can only narrow the result, never widen it.
 *
 * `COLLATE NOCASE` stays acceptable only inside an already-narrow indexed
 * range — e.g. `WHERE parent_name = ? AND type = ? AND name = ? COLLATE
 * NOCASE` after the parent name has been canonicalized through one of these
 * lookups.
 */
/** Quote a name as an FTS5 phrase (strips embedded double quotes). */
function ftsPhrase(name) {
    return `"${name.replace(/"/g, '')}"`;
}
const HIT_COLS = 's.name, s.type, s.model, s.extends_class, s.file_path';
function typeFilter(types) {
    if (!types || types.length === 0)
        return { sql: '', params: [] };
    return {
        sql: ` AND s.type IN (${types.map(() => '?').join(', ')})`,
        params: [...types],
    };
}
/**
 * Case-insensitive lookup of top-level symbols (parent_name IS NULL) by name,
 * optionally scoped to a set of types. Exact-case rows come first; rows with
 * different casing are found through the FTS fallback and deduplicated.
 */
export function lookupSymbolsNocase(db, name, opts = {}) {
    if (!name)
        return [];
    const limit = opts.limit ?? 1;
    const tf = typeFilter(opts.types);
    const exact = db.prepare(`SELECT ${HIT_COLS} FROM symbols s
     WHERE s.name = ?${tf.sql} AND s.parent_name IS NULL
     LIMIT ?`).all(name, ...tf.params, limit);
    if (exact.length >= limit)
        return exact;
    const fts = db.prepare(`SELECT ${HIT_COLS} FROM symbols_fts fts
     JOIN symbols s ON s.id = fts.rowid
     WHERE symbols_fts MATCH ?
       AND s.name = ? COLLATE NOCASE${tf.sql} AND s.parent_name IS NULL
     LIMIT ?`).all(`{name} : ${ftsPhrase(name)}`, name, ...tf.params, limit);
    const key = (r) => `${r.name}\0${r.type}\0${r.model ?? ''}`;
    const seen = new Set(exact.map(key));
    const merged = [...exact];
    for (const r of fts) {
        if (!seen.has(key(r))) {
            seen.add(key(r));
            merged.push(r);
        }
    }
    return merged.slice(0, limit);
}
/** First case-insensitive top-level hit for a name, or undefined. */
export function lookupSymbolNocase(db, name, types) {
    return lookupSymbolsNocase(db, name, { types, limit: 1 })[0];
}
/**
 * Canonical (as-indexed) casing of a top-level object name, or undefined when
 * the name is not in the index. Use this to canonicalize a user-supplied name
 * once, so follow-up probes on parent_name/base_object_name stay BINARY and
 * on-index.
 */
export function canonicalSymbolName(db, name, types) {
    return lookupSymbolNocase(db, name, types)?.name;
}
/**
 * All DISTINCT symbol types recorded for a name under any casing and any
 * parent (methods and fields included) — index-safe replacement for
 * `SELECT DISTINCT type FROM symbols WHERE name = ? COLLATE NOCASE`.
 */
export function distinctSymbolTypesNocase(db, name, limit = 10) {
    if (!name)
        return [];
    const types = new Set();
    const exact = db.prepare('SELECT DISTINCT type FROM symbols WHERE name = ? LIMIT ?').all(name, limit);
    for (const r of exact)
        types.add(r.type);
    if (types.size < limit) {
        // Cap the FTS candidate set: a name shared by tens of thousands of rows
        // (e.g. every table's `insert` method) would otherwise cost that many row
        // lookups (~10 s cold). Differently-cased rows beyond the cap are
        // sacrificed — the exact-case probe above already covered exact casing.
        const fts = db.prepare(`SELECT DISTINCT s.type FROM (
         SELECT rowid FROM symbols_fts WHERE symbols_fts MATCH ? LIMIT 3000
       ) f JOIN symbols s ON s.id = f.rowid
       WHERE s.name = ? COLLATE NOCASE
       LIMIT ?`).all(`{name} : ${ftsPhrase(name)}`, name, limit);
        for (const r of fts)
            types.add(r.type);
    }
    return [...types].slice(0, limit);
}
//# sourceMappingURL=symbolLookup.js.map