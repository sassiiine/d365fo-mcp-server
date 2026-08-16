/**
 * The single place that answers "which prefix does this session actually apply?"
 *
 * Two components used to answer it separately: get_workspace_info reported the
 * prefix the ACTIVE MODEL's own objects use, while validate_object_naming
 * checked names against the configured EXTENSION_PREFIX. With the two
 * disagreeing — the ordinary state, since a globally configured prefix cannot be
 * right for every model — the server reported one token as authoritative and
 * then rejected names built from it (#833). The resolution therefore lives here
 * and both tools read it, together with the candidates a name may legitimately
 * carry while the disagreement lasts.
 *
 * The resolution ORDER is not restated here: resolveRawPrefix() in
 * modelClassifier.ts owns it (model objects → EXTENSION_PREFIX → model name).
 * This module adds what the callers need on top of the winning token — where it
 * came from, what lost, and whether the two disagree at all.
 */
import { resolveObjectPrefix } from './modelClassifier.js';
import { getInferredModelPrefix } from './modelPrefixInference.js';
import { crossModelWriteAllowedByConfig } from './crossModelWriteGuard.js';
/**
 * Compare prefixes bare: "DEMO_" from the model's objects and "DEMO" in the
 * environment are the same prefix — the underscore belongs to the regular-object
 * form, not to the token.
 */
function bare(token) {
    return token.replace(/_+$/, '');
}
/**
 * The model a write would actually land in.
 *
 * Normally the anchor: a project switch does not move writes. But when the
 * operator has allowed writes into the switched-to model in configuration, the
 * guard lets them through and they land in the ACTIVE model — so that is the
 * model whose prefix a create would apply. Reporting the anchor's prefix there
 * would be the same defect one state over.
 */
export function modelWritesLandIn(anchorModel, activeModel) {
    if (!activeModel || sameModel(activeModel, anchorModel))
        return anchorModel;
    return crossModelWriteAllowedByConfig(activeModel) ? activeModel : anchorModel;
}
/**
 * Model names compare case-insensitively everywhere else (crossModelWriteGuard's
 * eq, ConfigManager's anchor bookkeeping). Comparing them exactly here would
 * report a switch — and a whole "writes are NOT switched" section — for two
 * spellings of one model.
 */
export function sameModel(a, b) {
    if (!a || !b)
        return a === b;
    return a.trim().toLowerCase() === b.trim().toLowerCase();
}
/**
 * Resolve the prefix for the model writes land in, with its origin and whatever
 * it overruled.
 */
export function resolveEffectivePrefix(modelName) {
    const configured = process.env.EXTENSION_PREFIX?.trim() || null;
    const inferred = modelName ? getInferredModelPrefix(modelName) : null;
    const prefix = resolveObjectPrefix(modelName ?? '');
    // "0/13 objects" is what this said when the token came from the model's
    // extension ELEMENTS rather than its regular objects (coverage is the regular
    // objects' count, and there were none to agree). A line that contradicts
    // itself in the section built to make the prefix checkable is worse than a
    // vaguer one, so each origin states the evidence it actually has.
    const source = inferred?.regular
        ? inferred.coverage > 0
            ? `inferred from ${inferred.coverage}/${inferred.sampleSize} objects of model "${modelName}"`
            : `inferred from the extension elements of model "${modelName}"`
        : configured
            ? 'EXTENSION_PREFIX'
            : 'model name (nothing configured)';
    const conflict = !!inferred?.regular && !!configured && bare(inferred.regular).toLowerCase() !== bare(configured).toLowerCase();
    return { modelName: modelName || null, prefix, source, configured, inferred, conflict };
}
/**
 * The tokens a proposed name may legitimately start with. Exactly one entry
 * while configuration and model agree; while they disagree the loser stays a
 * candidate, because a name built from it is a naming-convention question for
 * the operator to settle, not an error for the server to declare.
 */
export function prefixCandidates(resolution) {
    const out = [];
    const add = (token, label, effective) => {
        const t = bare(token?.trim() ?? '');
        if (!t || out.some(c => c.token.toLowerCase() === t.toLowerCase()))
            return;
        out.push({ token: t, label, effective });
    };
    add(resolution.prefix, 'the effective prefix', true);
    add(resolution.inferred?.regular, `the prefix model "${resolution.modelName}"'s own objects use`, false);
    add(resolution.configured, 'the configured EXTENSION_PREFIX', false);
    return out;
}
/** The candidate `token` is, or null when it is none of them. */
export function matchPrefixCandidate(token, candidates) {
    const needle = bare(token).toLowerCase();
    if (!needle)
        return null;
    return candidates.find(c => c.token.toLowerCase() === needle) ?? null;
}
/**
 * The one warning both tools emit while the two sources disagree: it names both
 * candidates and how to pin the configured one. Null when there is no conflict.
 */
export function prefixConflictWarning(resolution) {
    if (!resolution.conflict)
        return null;
    return (`The model's own objects use "${resolution.inferred.regular}", overriding ` +
        `EXTENSION_PREFIX="${resolution.configured}". ` +
        `To pin the configured value instead: naming.prefixSource=config (env: EXTENSION_PREFIX_SOURCE=config).`);
}
//# sourceMappingURL=effectivePrefix.js.map