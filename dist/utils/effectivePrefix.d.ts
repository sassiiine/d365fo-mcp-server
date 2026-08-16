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
import { type InferredModelPrefix } from './modelPrefixInference.js';
/** Everything a caller needs to state, and justify, the prefix it applies. */
export interface EffectivePrefix {
    /** The model the prefix was resolved FOR — the one writes land in. */
    modelName: string | null;
    /** The prefix a write applies, trailing '_' stripped. '' when nothing resolves. */
    prefix: string;
    /** Where `prefix` came from, in prose ("inferred from 27/27 objects of model …"). */
    source: string;
    /** EXTENSION_PREFIX as configured, trimmed; null when unset. */
    configured: string | null;
    /** The token the model's own objects use; null when it has none to teach. */
    inferred: InferredModelPrefix | null;
    /** True when the model's objects and EXTENSION_PREFIX name different tokens. */
    conflict: boolean;
}
/** A prefix a proposed name may legitimately carry, and what it is. */
export interface PrefixCandidate {
    /** The bare token, without the regular-object underscore. */
    token: string;
    /** How to name this candidate in a message. */
    label: string;
    /** True for the token the server would actually apply. */
    effective: boolean;
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
export declare function modelWritesLandIn(anchorModel: string | null, activeModel: string | null): string | null;
/**
 * Model names compare case-insensitively everywhere else (crossModelWriteGuard's
 * eq, ConfigManager's anchor bookkeeping). Comparing them exactly here would
 * report a switch — and a whole "writes are NOT switched" section — for two
 * spellings of one model.
 */
export declare function sameModel(a: string | null, b: string | null): boolean;
/**
 * Resolve the prefix for the model writes land in, with its origin and whatever
 * it overruled.
 */
export declare function resolveEffectivePrefix(modelName: string | null): EffectivePrefix;
/**
 * The tokens a proposed name may legitimately start with. Exactly one entry
 * while configuration and model agree; while they disagree the loser stays a
 * candidate, because a name built from it is a naming-convention question for
 * the operator to settle, not an error for the server to declare.
 */
export declare function prefixCandidates(resolution: EffectivePrefix): PrefixCandidate[];
/** The candidate `token` is, or null when it is none of them. */
export declare function matchPrefixCandidate(token: string, candidates: PrefixCandidate[]): PrefixCandidate | null;
/**
 * The one warning both tools emit while the two sources disagree: it names both
 * candidates and how to pin the configured one. Null when there is no conflict.
 */
export declare function prefixConflictWarning(resolution: EffectivePrefix): string | null;
//# sourceMappingURL=effectivePrefix.d.ts.map