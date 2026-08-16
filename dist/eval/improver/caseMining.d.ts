/**
 * Case mining (docs/AGENT_EVAL_LOOP.md §9, "Self-improving upgrades"). VM-free.
 *
 * "The catalog grows itself" — a real tool-defect/friction point hit during
 * ANY agent session (not just a controlled eval run) is a candidate eval case:
 * if it bit a real session once, it's worth a permanent regression case so a
 * future fix (or future regression) is caught by the loop automatically. This
 * module is the converter: given a short structured description of what went
 * wrong, produce a schema-conformant `eval/cases/*.json` DRAFT.
 *
 * The draft is deliberately a skeleton, not a finished case: it carries
 * `golden_pending: true` (no golden captured yet — that needs a VM run per
 * §6.4) and enters the `holdout` split (§10, new cases are held out by
 * default). A human/improver-agent still needs to refine the `instruction`
 * into something precise enough to reproduce deterministically, and a VM run
 * captures the golden before the case is "real". Mining only saves the
 * bookkeeping (id, schema shape, file placement) so a real failure doesn't
 * just get fixed and forgotten.
 */
export interface MinedFailureInput {
    /** Human-readable one-line title (becomes the case's `title`). */
    title: string;
    /** Complexity tier 0-4 (docs/AGENT_EVAL_LOOP.md §8). */
    tier: 0 | 1 | 2 | 3 | 4;
    /** Free text describing what happened / how to reproduce it — becomes a draft `instruction`. */
    instructionHint: string;
    /** AOT object types the case is expected to produce, e.g. ["AxTable"]. */
    targetArtifactTypes: string[];
    tags?: string[];
    /** Optional explicit id slug (without the `L<tier>-` prefix); derived from title if omitted. */
    idSlug?: string;
}
export interface MinedCaseSpec {
    id: string;
    title: string;
    tier: number;
    instruction: string;
    target_artifact_types: string[];
    golden_path: string;
    golden_pending: true;
    ignore: string[];
    tags: string[];
    split: 'holdout';
}
/** Lowercase, alphanumeric-and-dashes slug matching the case id pattern `^[a-z0-9-]+$`. */
export declare function slugify(text: string): string;
/** Build a draft case spec from a mined failure description. Does not touch disk. */
export declare function mineCaseFromFailure(input: MinedFailureInput): MinedCaseSpec;
/**
 * Write a mined case to eval/cases/<id>.json. Refuses to overwrite an existing
 * case (mining should never silently clobber a hand-authored or already-mined
 * case — pick a different idSlug, or edit the file directly).
 */
export declare function writeMinedCase(spec: MinedCaseSpec, casesDir: string): string;
//# sourceMappingURL=caseMining.d.ts.map