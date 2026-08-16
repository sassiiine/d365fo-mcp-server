/**
 * NeonSymbolIndex — Postgres/Neon backend for the X++ metadata search index.
 *
 * This is the Architecture-A read path: the same searches the MCP performs
 * against the local SQLite FTS5 index, reimplemented against Neon Postgres with
 * pg_trgm. It returns the identical `XppSymbol` shape as XppSymbolIndex, so it
 * is a drop-in replacement for the READ methods — the one difference is that
 * every method is async (a network round-trip), where the SQLite versions are
 * synchronous. Callers must therefore `await`.
 *
 * Search correctness was validated at full scale (1,153,102 symbols /
 * 363,147 labels) at 100% recall & precision vs FTS5 for the primary, typed and
 * label paths, and 100% recall for the source_snippet path. See schema.sql.
 *
 * Why the query shapes are what they are:
 *  - FTS5 prefix `"tok"*` on the light columns  →  a token in `search_light`
 *    that starts with `tok`. In Postgres that is the regex `(^|[^a-z0-9])tok`:
 *    any non-alphanumeric (incl. underscore, matching FTS5's tokenizer) or the
 *    string start, followed by the token. `\m` is WRONG here — Postgres treats
 *    `_` as a word char, so `\m` misses `on_post`.
 *  - Multiple tokens are AND-ed, matching FTS5's implicit AND.
 *  - An all-stopword query (e.g. "find") → FTS5 does an exact-word phrase match;
 *    we mirror that with `(^|[^a-z0-9])phrase([^a-z0-9]|$)`.
 *  - source_snippet is deliberately NOT trigram-indexed (it holds full X++
 *    source; indexing it would balloon storage). The specialized
 *    `source_snippet:` searches scan it directly — acceptable because they are
 *    rare and narrow.
 */
import { Pool } from 'pg';
import { isStandardModel } from '../../utils/modelClassifier.js';
/** Query verbs / type keywords stripped before tokenising — verbatim from
 *  XppSymbolIndex.sanitizeFtsQuery so both backends tokenise identically. */
const STOP_WORDS = new Set([
    'vyhledej', 'najdi', 'zobraz', 'ukaž', 'související', 'proces', 'procesy',
    'find', 'search', 'show', 'get', 'list', 'related', 'process', 'processes',
    'method', 'methods', 'class', 'classes', 'table', 'tables', 'třídy', 'třída',
]);
/** The essential columns searchSymbols returns (kept light — matches the SQLite
 *  path, which avoids loading the big source/text columns on every search). */
const ESSENTIAL_COLS = 'id, name, type, parent_name, signature, file_path, model, description';
/** Full detail columns for a single-symbol fetch — EVERYTHING rowToSymbol maps
 *  EXCEPT the two large free-text blobs `source` and `source_snippet`. A `SELECT *`
 *  here dragged the entire X++ source of the matched object across the network on
 *  every getSymbolByName (measured ~2 s on a real object vs ~150 ms for the light
 *  searches); callers use file_path to read source from disk, so the blobs are
 *  dead weight on the wire. */
const DETAIL_COLS = 'id, name, type, parent_name, signature, file_path, model, package_name, ' +
    'description, tags, complexity, used_types, method_calls, inline_comments, ' +
    'extends_class, implements_interfaces, usage_example, usage_frequency, ' +
    'pattern_type, typical_usages, called_by_count, related_methods, api_patterns';
export class NeonSymbolIndex {
    pool;
    schema;
    constructor(config) {
        this.schema = config.schema;
        // A long-lived TCP pool — correct for a Cloud Run container that serves
        // many requests over minutes/hours (not a per-request serverless isolate).
        this.pool = new Pool({
            connectionString: config.connectionString,
            max: config.maxPoolSize,
        });
    }
    /** Tokenise exactly as XppSymbolIndex.sanitizeFtsQuery does. */
    tokenize(query) {
        return query
            .replace(/[^\w\s]/g, ' ')
            .trim()
            .split(/\s+/)
            .filter((t) => t.length > 0)
            .map((t) => t.toLowerCase())
            .filter((t) => !STOP_WORDS.has(t) && t.length > 1);
    }
    static boundaryPrefix(tok) {
        return `(^|[^a-z0-9])${tok}`;
    }
    /**
     * Full-text symbol search — the hot path. Mirrors XppSymbolIndex.searchSymbols.
     * Ordering: FTS5's bm25 `rank` has no Postgres equivalent; we approximate
     * relevance with shortest-name-first (an exact/short name is usually the
     * intended target). This is a documented tuning point, not a correctness one.
     */
    async searchSymbols(query, limit = 20, types) {
        const tokens = this.tokenize(query);
        const params = [];
        let where;
        if (tokens.length === 0) {
            // All-stopword query → FTS5 exact-word phrase match.
            params.push(`(^|[^a-z0-9])${query.trim().toLowerCase()}([^a-z0-9]|$)`);
            where = `search_light ~ $1`;
        }
        else {
            where = tokens
                .map((t) => {
                params.push(NeonSymbolIndex.boundaryPrefix(t));
                return `search_light ~ $${params.length}`;
            })
                .join(' AND ');
        }
        let sql = `SELECT ${ESSENTIAL_COLS} FROM ${this.schema}.symbols WHERE ${where}`;
        if (types && types.length > 0) {
            sql += ` AND type IN (${types.map((_, i) => `$${params.length + i + 1}`).join(',')})`;
            params.push(...types);
        }
        // Relevance ordering (bm25 has no Postgres equivalent): surface the object
        // whose NAME best matches the query first — exact name, then name-prefix,
        // then name-contains, then shortest. This puts e.g. the `CustTable` table
        // above an unrelated `Key` field that merely mentions it in a signature.
        const qraw = query.trim().toLowerCase();
        params.push(qraw);
        const qp = params.length;
        sql += ` ORDER BY
      CASE WHEN lower(name) = $${qp} THEN 0
           WHEN lower(name) LIKE $${qp} || '%' THEN 1
           WHEN position($${qp} in lower(name)) > 0 THEN 2
           ELSE 3 END,
      length(name), name
      LIMIT $${params.length + 1}`;
        params.push(limit);
        try {
            const { rows } = await this.pool.query(sql, params);
            return rows.map((r) => this.rowToSymbol(r));
        }
        catch {
            // Mirror the SQLite fallback: contains-match on name with LIKE escaping.
            return this.searchByNameLike(query, types, limit);
        }
    }
    /** LIKE-contains fallback on name (matches the FTS5 catch fallback). */
    async searchByNameLike(query, types, limit) {
        const escaped = query.toLowerCase().replace(/[\\%_]/g, (m) => '\\' + m);
        const params = [`%${escaped}%`];
        let sql = `SELECT ${ESSENTIAL_COLS} FROM ${this.schema}.symbols WHERE lower(name) LIKE $1`;
        if (types && types.length > 0) {
            sql += ` AND type IN (${types.map((_, i) => `$${i + 2}`).join(',')})`;
            params.push(...types);
        }
        sql += ` ORDER BY name LIMIT $${params.length + 1}`;
        params.push(limit);
        const { rows } = await this.pool.query(sql, params);
        return rows.map((r) => this.rowToSymbol(r));
    }
    /** Prefix search for autocomplete. Mirrors XppSymbolIndex.searchByPrefix. */
    async searchByPrefix(prefix, types, limit = 20) {
        const escaped = prefix.toLowerCase().replace(/[\\%_]/g, (m) => '\\' + m);
        const params = [`${escaped}%`];
        let sql = `SELECT ${ESSENTIAL_COLS} FROM ${this.schema}.symbols WHERE lower(name) LIKE $1`;
        if (types && types.length > 0) {
            sql += ` AND type IN (${types.map((_, i) => `$${i + 2}`).join(',')})`;
            params.push(...types);
        }
        sql += ` ORDER BY length(name), name LIMIT $${params.length + 1}`;
        params.push(limit);
        const { rows } = await this.pool.query(sql, params);
        return rows.map((r) => this.rowToSymbol(r));
    }
    /** Exact (name,type) lookup. Mirrors XppSymbolIndex.getSymbolByName. */
    async getSymbolByName(name, type) {
        const { rows } = await this.pool.query(`SELECT ${DETAIL_COLS} FROM ${this.schema}.symbols WHERE name = $1 AND type = $2 LIMIT 1`, [name, type]);
        return rows.length ? this.rowToSymbol(rows[0]) : null;
    }
    /**
     * Specialised full-source search — powers the event-handler / CoC / reference
     * tools that do `symbols_fts MATCH 'source_snippet:X'`. Scans source_snippet
     * directly (it is not trigram-indexed). Recall matches FTS5; precision can be
     * marginally looser (a few extra hits) because pg_trgm's boundary is slightly
     * broader than FTS5's code tokenizer.
     */
    async searchSourceSnippet(token, limit = 200) {
        const { rows } = await this.pool.query(`SELECT ${ESSENTIAL_COLS}, source_snippet FROM ${this.schema}.symbols
        WHERE lower(source_snippet) ~ $1 LIMIT $2`, [NeonSymbolIndex.boundaryPrefix(token.toLowerCase()), limit]);
        return rows.map((r) => this.rowToSymbol(r));
    }
    /** Label search. Mirrors XppSymbolIndex.searchLabels (en-US FTS path). */
    async searchLabels(query, opts = {}) {
        const { language = 'en-US', model, labelFileId, limit = 30 } = opts;
        const tokens = this.tokenize(query);
        const params = [];
        let where;
        if (tokens.length === 0) {
            params.push(`(^|[^a-z0-9])${query.trim().toLowerCase()}([^a-z0-9]|$)`);
            where = `search_light ~ $1`;
        }
        else {
            where = tokens
                .map((t) => {
                params.push(NeonSymbolIndex.boundaryPrefix(t));
                return `search_light ~ $${params.length}`;
            })
                .join(' AND ');
        }
        let sql = `SELECT label_id, label_file_id, model, language, text, comment, file_path
                 FROM ${this.schema}.labels WHERE ${where}`;
        if (language) {
            sql += ` AND language = $${params.length + 1}`;
            params.push(language);
        }
        if (model) {
            sql += ` AND model = $${params.length + 1}`;
            params.push(model);
        }
        if (labelFileId) {
            sql += ` AND label_file_id = $${params.length + 1}`;
            params.push(labelFileId);
        }
        sql += ` ORDER BY length(text), text LIMIT $${params.length + 1}`;
        params.push(limit);
        const { rows } = await this.pool.query(sql, params);
        return rows.map((r) => ({
            labelId: r.label_id, labelFileId: r.label_file_id, model: r.model,
            language: r.language, text: r.text, comment: r.comment ?? null, filePath: r.file_path,
        }));
    }
    /**
     * Case-insensitive EXACT name lookup, bounded — the Neon half of the search
     * tool's exact-first splice. The SQLite path used `name = ?` on idx_name_type
     * with an FTS fallback for differently-cased input; here a single
     * case-insensitive equality covers both.
     *
     * `name ILIKE $1` with a LIKE-escaped literal (no wildcards) is deliberate:
     * it is an equality test that pg_trgm's GIN index on search_light can assist,
     * whereas `lower(name) = lower($1)` has no usable index and degrades to a
     * sequential scan of 1.15M rows.
     */
    async lookupExactNames(query, types, limit = 5) {
        // Same guard as the SQLite probe: whitespace or FTS metacharacters mean this
        // is not an exact name and the probe must not fire.
        if (!query || /[\s*"%]/.test(query))
            return [];
        const escaped = query.replace(/[\\%_]/g, (m) => '\\' + m);
        const params = [escaped];
        let sql = `SELECT name, type, model, file_path FROM ${this.schema}.symbols
                WHERE name ILIKE $1 AND parent_name IS NULL`;
        if (types && types.length > 0) {
            sql += ` AND type IN (${types.map((_, i) => `$${i + 2}`).join(',')})`;
            params.push(...types);
        }
        sql += ` LIMIT $${params.length + 1}`;
        params.push(limit);
        try {
            const { rows } = await this.pool.query(sql, params);
            return rows.map((r) => ({
                name: r.name,
                type: r.type,
                model: r.model || undefined,
                filePath: r.file_path || undefined,
            }));
        }
        catch {
            return [];
        }
    }
    /**
     * Keyword search restricted to CUSTOM models. Mirrors
     * XppSymbolIndex.searchCustomModelSymbols: the token match drives the query
     * and the model filter narrows it to the small custom set.
     */
    async searchCustomModelSymbols(query, types, limit = 15) {
        if (!query)
            return [];
        try {
            const customModels = await this.getCustomModels();
            if (customModels.length === 0)
                return [];
            const tokens = this.tokenize(query);
            const params = [];
            let where;
            if (tokens.length === 0) {
                params.push(`(^|[^a-z0-9])${query.trim().toLowerCase()}([^a-z0-9]|$)`);
                where = `search_light ~ $1`;
            }
            else {
                where = tokens
                    .map((t) => {
                    params.push(NeonSymbolIndex.boundaryPrefix(t));
                    return `search_light ~ $${params.length}`;
                })
                    .join(' AND ');
            }
            params.push(customModels);
            let sql = `SELECT ${ESSENTIAL_COLS} FROM ${this.schema}.symbols
                  WHERE ${where} AND model = ANY($${params.length})`;
            if (types && types.length > 0) {
                sql += ` AND type IN (${types.map((_, i) => `$${params.length + i + 1}`).join(',')})`;
                params.push(...types);
            }
            sql += ` ORDER BY length(name), name LIMIT $${params.length + 1}`;
            params.push(limit);
            const { rows } = await this.pool.query(sql, params);
            return rows.map((r) => this.rowToSymbol(r));
        }
        catch {
            // Must never break search — same contract as the SQLite probe.
            return [];
        }
    }
    /**
     * Distinct non-standard models, cached for the process lifetime. The set only
     * changes when the index is rebuilt, and this would otherwise run a DISTINCT
     * over 1.15M rows on every custom probe.
     */
    customModelsCache = null;
    async getCustomModels() {
        if (this.customModelsCache)
            return this.customModelsCache;
        const { rows } = await this.pool.query(`SELECT DISTINCT model FROM ${this.schema}.symbols ORDER BY model`);
        this.customModelsCache = rows
            .map((r) => r.model)
            .filter((m) => m && !isStandardModel(m));
        return this.customModelsCache;
    }
    async getSymbolCount() {
        const { rows } = await this.pool.query(`SELECT count(*)::int AS n FROM ${this.schema}.symbols`);
        return rows[0].n;
    }
    async close() {
        await this.pool.end();
    }
    /** Identical mapping to XppSymbolIndex.rowToSymbol so callers see the same shape. */
    rowToSymbol(row) {
        return {
            name: row.name,
            type: row.type,
            parentName: row.parent_name || undefined,
            signature: row.signature || undefined,
            filePath: row.file_path,
            model: row.model,
            packageName: row.package_name || row.model,
            description: row.description || undefined,
            tags: row.tags || undefined,
            sourceSnippet: row.source_snippet || undefined,
            complexity: row.complexity || undefined,
            usedTypes: row.used_types || undefined,
            methodCalls: row.method_calls || undefined,
            inlineComments: row.inline_comments || undefined,
            extendsClass: row.extends_class || undefined,
            implementsInterfaces: row.implements_interfaces || undefined,
            usageExample: row.usage_example || undefined,
            usageFrequency: row.usage_frequency || undefined,
            patternType: row.pattern_type || undefined,
            typicalUsages: row.typical_usages || undefined,
            calledByCount: row.called_by_count || undefined,
            relatedMethods: row.related_methods || undefined,
            apiPatterns: row.api_patterns || undefined,
        };
    }
}
//# sourceMappingURL=neonSymbolIndex.js.map