/**
 * Eval oracle CLI — score a produced artifact against its golden and (optionally)
 * write a corpus record. VM-free: run after capturing the build result.
 *
 *   tsx src/eval/oracle/cli.ts <caseId> <actualXml> [options]
 *     --golden <path>     explicit golden file (default: first *.metadata.xml in eval/goldens/<caseId>/)
 *     --actual-dir <dir>  MULTI-ARTIFACT mode: score every *.metadata.xml golden in
 *                         eval/goldens/<caseId>/ against a same-named file in <dir>
 *                         (L3/L4 cases that produce several objects). Mutually
 *                         exclusive with the single <actualXml> positional/--golden.
 *     --build-failed      mark build as failed (default: succeeded)
 *     --bp-warnings <n>   number of BP warnings xppbp reported (OMIT = BP not checked -> bp_clean: null)
 *     --systest <file>    text file with the `run_systest_class` output (runtime oracle)
 *     --classification <C> rubric class for the record (default: derived)
 *     --golden-prefix <p> EXTENSION_PREFIX the golden was captured under (default: every GOLDEN_CAPTURE_PREFIXES token)
 *     --actual-prefix <p> EXTENSION_PREFIX the actual was produced under (default: read from THIS
 *                         process's EXTENSION_PREFIX env var — the session that ran the case)
 *     --write             append a corpus record to eval/corpus/runs/
 *
 * `<actualXml>` may itself be a golden path to self-check the oracle (expect match).
 *
 * Root-object-name (and other prefixed-identifier) comparisons are
 * prefix-agnostic by default: an actual object built under a DIFFERENT
 * EXTENSION_PREFIX session than the one the golden was captured under still
 * scores golden_match=1 as long as the object is otherwise identical (see
 * docs/AGENT_EVAL_LOOP.md §6.2 and the corpus record that surfaced this —
 * eval/corpus/runs/2026-07-06T10__L0-edt-basic__4fafcd8.json).
 */
export {};
//# sourceMappingURL=cli.d.ts.map