/**
 * Harness-level eval fixtures — the INPUT/OUTPUT classifier, fixture loader, and
 * rollback-exclusion partition (VM-free, pure). See docs/AGENT_EVAL_LOOP.md
 * §4a/§11 and eval/fixtures/README.md.
 *
 * Problem this solves. A handful of `ConDemo*` objects (chiefly the table
 * `ConDemoNoteHeader`) are SHARED across cases: one case creates them, ~18 others
 * READ from them. But the implementer protocol rolls back every case after
 * scoring, so a shared object created by a case cannot survive — each rollback
 * re-breaks every dependent case. The fix is to lift such shared INPUTS out of
 * the cases into repo-committed fixtures (eval/fixtures/*.metadata.xml) that are
 * (re)provisioned before each dependent case and EXCLUDED from that case's
 * rollback.
 *
 * The crux is telling INPUTS apart from the ~50 `ConDemo*`/`DemoNote*` names the
 * catalog mentions — MOST of which are case OUTPUTS that must NOT be
 * pre-provisioned. This module derives that split from the catalog itself:
 *   - a base name referenced by exactly ONE case is that case's OUTPUT;
 *   - a base name referenced by MORE THAN ONE case is SHARED and needs an
 *     explicit decision (INPUT fixture / OUTPUT / needs-review) recorded in
 *     SHARED_DECISIONS below.
 * `unresolved` (a shared base with no decision) is what a new case introducing a
 * silent cross-case dependency would surface — the unit test fails on it, so the
 * harness can never drift into an unprovisioned shared object again.
 *
 * VM-free boundary: this module classifies and partitions. Actually WRITING the
 * fixture into the sandbox (`d365fo_file` create) and reindexing
 * (`update_symbol_index`) is the agent/VM step — see the protocol docs.
 */
export declare const REPO_ROOT: string;
export declare const CASES_DIR: string;
/** Strip the extension prefix so `ConDemoNoteHeader` and `DemoNoteHeader` unify. */
export declare function baseName(token: string): string;
export interface CaseLite {
    id: string;
    instruction: string;
    title?: string;
}
/** Extract the set of demo BASE names a single case mentions (title + instruction). */
export declare function demoBasesInCase(c: CaseLite): Set<string>;
/**
 * How a shared base is resolved. Every base the classifier reports as SHARED must
 * appear here or it lands in `unresolved` (and the test fails). This is the
 * human-audited part — the classifier can prove a name is shared, but only a
 * reviewer knows whether a shared name is a real fixture, a coincidental
 * collision, or a latent gap.
 */
export type Decision = 'INPUT' | 'OUTPUT' | 'NEEDS_REVIEW';
export interface SharedDecision {
    decision: Decision;
    /** For an INPUT fixture: the case that authored it (so it is NOT re-provisioned into its own origin). */
    origin?: string;
    note: string;
}
export declare const SHARED_DECISIONS: Record<string, SharedDecision>;
export interface ClassifiedShared {
    base: string;
    cases: string[];
    decision: Decision;
    note: string;
}
export interface Classification {
    /** base -> the single case that owns it (created and consumed there). */
    outputs: {
        base: string;
        case: string;
    }[];
    /** bases referenced by >1 case, with their audited decision. */
    shared: ClassifiedShared[];
    /** shared bases with no SHARED_DECISIONS entry — must be empty (test-enforced). */
    unresolved: string[];
    /** AOT object names to pre-provision before dependent cases (decision === INPUT). */
    provisioned: string[];
}
/**
 * Classify every demo object the catalog mentions as an OUTPUT (single-case) or
 * SHARED (multi-case), and resolve each SHARED base via SHARED_DECISIONS.
 */
export declare function classifyDemoObjects(cases: CaseLite[]): Classification;
export interface FixtureDef {
    /** AOT object name (post-prefix), e.g. ConDemoNoteHeader. */
    name: string;
    /** AOT root element, e.g. AxTable. */
    objectType: string;
    file: string;
    xml: string;
}
/** Load the committed fixture definitions from eval/fixtures/*.metadata.xml. */
export declare function loadFixtures(dir?: string): FixtureDef[];
/** Fixture object names that have a committed definition on disk. */
export declare function fixtureNames(dir?: string): Set<string>;
/**
 * Fixture names a given case needs pre-provisioned: provisioned fixtures whose
 * base the case references, EXCLUDING the fixture's own origin case (which
 * creates it and whose golden IS the definition). Drives step (b): the agent
 * provisions exactly these before running the case.
 */
export declare function fixturesForCase(caseId: string, cases: CaseLite[]): string[];
export interface RollbackPartition {
    /** case-written objects to undo/wipe. */
    undo: string[];
    /** objects to KEEP because they are harness fixtures. */
    keep: string[];
}
/**
 * Split a case's written objects into what rollback may undo vs. what it must
 * KEEP because it is a fixture (step (c): rollback made fixture-aware). Names are
 * final AOT names (ConDemo*), matched against the fixture set directly.
 */
export declare function partitionForRollback(written: string[], fixtures?: Set<string>): RollbackPartition;
/** Load the catalog as CaseLite[] (id/title/instruction), skipping schema.json. */
export declare function loadCases(dir?: string): CaseLite[];
//# sourceMappingURL=fixtures.d.ts.map