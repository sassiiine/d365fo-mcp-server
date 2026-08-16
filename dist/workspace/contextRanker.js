/**
 * Context Ranker — Phase 2 of the context pipeline.
 *
 * Given a free-text intent (e.g. a prepare `goal`) and an optional active
 * object, rank the most relevant symbols from the codebase and return a
 * token-budgeted neighborhood that grounds the next generation step.
 *
 * Index-only and deterministic: candidates come from the FTS5 index, scoring
 * uses precomputed xref/usage signals (no bridge call needed), and each item
 * carries explainable `reasons`. Every index access is guarded so a
 * missing/empty index yields an empty ranking rather than an error.
 */
import { searchBackend } from '../metadata/searchBackend.js';
import { isCustomModel } from '../utils/modelClassifier.js';
const DEFAULT_LIMIT = 12;
const DEFAULT_TOKEN_BUDGET = 700;
const CANDIDATE_POOL = 40;
// Small stoplist — generic verbs/nouns that carry no grounding signal.
const STOPWORDS = new Set([
    'add', 'new', 'the', 'and', 'for', 'with', 'this', 'that', 'from', 'into',
    'use', 'using', 'create', 'change', 'modify', 'update', 'make', 'set', 'get',
    'method', 'field', 'class', 'table', 'form', 'when', 'should', 'will', 'have',
    'custom', 'object', 'value', 'code', 'logic', 'rule', 'enforce', 'extend',
]);
/** Split free text into meaningful lowercase tokens (≥3 chars, no stopwords). */
export function tokenizeIntent(intent) {
    const seen = new Set();
    const out = [];
    for (const raw of intent.toLowerCase().split(/[^a-z0-9]+/)) {
        if (raw.length < 3 || STOPWORDS.has(raw) || seen.has(raw))
            continue;
        seen.add(raw);
        out.push(raw);
    }
    return out;
}
/** Approximate token cost of a string (~4 chars/token). */
function approxTokens(text) {
    return Math.ceil(text.length / 4);
}
function keyOf(s) {
    return `${s.type}::${s.parentName ?? ''}::${s.name}`.toLowerCase();
}
/** Pull comma-separated index field into a lowercase token set. */
function csvSet(value) {
    const set = new Set();
    if (!value)
        return set;
    for (const part of value.split(',')) {
        const t = part.trim().toLowerCase();
        if (t)
            set.add(t);
    }
    return set;
}
/**
 * Rank relevant symbols for an intent + optional active object.
 * Returns a token-budgeted, explainable neighborhood. Never throws.
 */
export async function rankContext(context, input) {
    const limit = input.limit ?? DEFAULT_LIMIT;
    const tokenBudget = input.tokenBudget ?? DEFAULT_TOKEN_BUDGET;
    const tokens = tokenizeIntent(input.intent);
    const activeName = input.activeObject?.name?.toLowerCase();
    // Gather candidates from FTS (intent terms + active object name)
    const pool = new Map();
    const ftsRank = new Map(); // key -> best normalized FTS score
    const addList = (list) => {
        const n = list.length || 1;
        list.forEach((sym, idx) => {
            const k = keyOf(sym);
            if (!pool.has(k))
                pool.set(k, sym);
            const norm = (n - idx) / n; // earlier hit → higher
            ftsRank.set(k, Math.max(ftsRank.get(k) ?? 0, norm));
        });
    };
    const backend = searchBackend(context);
    try {
        if (tokens.length > 0) {
            addList(await backend.searchSymbols(tokens.join(' '), CANDIDATE_POOL, input.types));
        }
        if (input.activeObject?.name) {
            addList(await backend.searchSymbols(input.activeObject.name, 20, input.types));
        }
    }
    catch {
        // Index unavailable — return an empty, well-formed result.
        return {
            intent: input.intent,
            activeObject: input.activeObject,
            items: [],
            truncated: false,
            approxTokens: 0,
        };
    }
    // Relationship anchors from the active object's own symbol.
    let anchorRelated = new Set();
    let anchorUsedTypes = new Set();
    if (input.activeObject?.name) {
        try {
            const anchor = (await backend.getSymbolByName(input.activeObject.name, input.activeObject.type ?? 'class')) ??
                pool.get(keyOf({ name: input.activeObject.name, type: input.activeObject.type ?? 'class' }));
            if (anchor) {
                anchorRelated = csvSet(anchor.relatedMethods);
                anchorUsedTypes = csvSet(anchor.usedTypes);
            }
        }
        catch {
            /* anchor optional */
        }
    }
    // Score
    const scored = [];
    for (const [k, sym] of pool) {
        // Drop the active object itself — it is the anchor, not its own neighbor.
        if (activeName && sym.name.toLowerCase() === activeName && !sym.parentName)
            continue;
        const reasons = [];
        let score = 0;
        const fts = ftsRank.get(k) ?? 0;
        if (fts > 0) {
            score += fts * 3;
            reasons.push('keyword match');
        }
        // Term overlap against name/signature/description/tags.
        const haystack = `${sym.name} ${sym.signature ?? ''} ${sym.description ?? ''} ${sym.tags ?? ''}`.toLowerCase();
        let overlap = 0;
        for (const t of tokens)
            if (haystack.includes(t))
                overlap++;
        if (overlap > 0) {
            score += overlap * 1.5;
            reasons.push(`${overlap} intent term${overlap > 1 ? 's' : ''}`);
        }
        // Popularity — well-used objects are better grounding anchors.
        const popularity = Math.max(sym.usageFrequency ?? 0, sym.calledByCount ?? 0);
        if (popularity > 0) {
            score += Math.log10(1 + popularity);
            reasons.push(`used ${popularity}×`);
        }
        // Prefer the developer's own code over Microsoft standard.
        if (isCustomModel(sym.model)) {
            score += 1;
            reasons.push('custom model');
        }
        // Relationship to the active object.
        const nameLc = sym.name.toLowerCase();
        if (activeName) {
            if (sym.parentName?.toLowerCase() === activeName) {
                score += 2;
                reasons.push(`member of ${input.activeObject.name}`);
            }
            if (anchorRelated.has(nameLc)) {
                score += 1.5;
                reasons.push('related method');
            }
            if (anchorUsedTypes.has(nameLc)) {
                score += 1;
                reasons.push('used by anchor');
            }
        }
        if (score <= 0)
            continue;
        scored.push({
            name: sym.name,
            type: sym.type,
            model: sym.model,
            parentName: sym.parentName,
            signature: sym.signature,
            score: Math.round(score * 100) / 100,
            reasons,
        });
    }
    scored.sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    // Apply token budget + limit
    const items = [];
    let used = 0;
    let truncated = false;
    for (const item of scored) {
        if (items.length >= limit) {
            truncated = true;
            break;
        }
        const cost = approxTokens(`${item.parentName ?? ''}.${item.name} ${item.signature ?? ''}`) + 6;
        if (used + cost > tokenBudget && items.length > 0) {
            truncated = true;
            break;
        }
        items.push(item);
        used += cost;
    }
    return {
        intent: input.intent,
        activeObject: input.activeObject,
        items,
        truncated,
        approxTokens: used,
    };
}
/** Render a ranked neighborhood as markdown lines for tool output. */
export function renderRankedContext(ranked) {
    if (ranked.items.length === 0) {
        return ['### Related context _(ranked)_', '(no related objects found in the index)'];
    }
    const lines = ['### Related context _(ranked: FTS + xref signals)_'];
    for (const item of ranked.items) {
        const owner = item.parentName ? `${item.parentName}.` : '';
        const sig = item.signature ? ` — ${item.signature}` : '';
        lines.push(`  • ${owner}${item.name} [${item.type}, ${item.model}]${sig}`);
        lines.push(`      ↳ ${item.reasons.join(', ')} (score ${item.score})`);
    }
    if (ranked.truncated) {
        lines.push('  … (more candidates omitted to fit the context budget)');
    }
    return lines;
}
//# sourceMappingURL=contextRanker.js.map