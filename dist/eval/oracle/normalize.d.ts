/**
 * AOT XML normalizer for the eval golden oracle.
 *
 * Flattens an AOT metadata XML document into a stable `path → value` map so two
 * documents can be diffed structurally (not textually). Key properties:
 *
 *  - Collection members (AxTableField, AxEnumValue, AxTableFieldGroup, …) are
 *    keyed by their `<Name>`/`<DataField>` rather than position, so reordering an
 *    unordered collection does not register as a diff.
 *  - Volatile nodes (`ModelSaveInfo`, `@Id`) and any per-case `ignore` globs are
 *    stripped before the map is built.
 *  - Attributes are included (notably `i:type`, which carries a field's base type
 *    e.g. AxTableFieldInt vs AxTableFieldString) under `@type` etc.
 *
 * See docs/AGENT_EVAL_LOOP.md §6.2.
 */
import { type PrefixSpec } from './prefix.js';
/**
 * The EXTENSION_PREFIX in effect when the committed `eval/goldens/` corpus was
 * authored (docs/AGENT_EVAL_LOOP.md §6.4). A golden's root object Name (and any
 * other prefixed identifier baked into it, e.g. an extension's added field
 * DataField, or a dot-notation extension suffix) is a literal string captured
 * under THIS prefix — it is not re-derived per run.
 *
 * A later eval run is free to configure ANY EXTENSION_PREFIX for its sandbox
 * session (e.g. "Demo") — `d365fo_file`/`generate_object` correctly apply the
 * CURRENT session's prefix to every new object per their documented contract
 * (src/utils/modelClassifier.ts). An object named "DemoXyzNoteSubject" and a
 * golden named "ContosoXyzNoteSubject" describe the SAME object under two
 * different prefix sessions — that is not a semantic difference, and must not
 * fail `golden_match` (see the corpus record that surfaced this:
 * eval/corpus/runs/2026-07-06T10__L0-edt-basic__4fafcd8.json).
 */
export declare const GOLDEN_CAPTURE_PREFIX = "Contoso";
/**
 * EVERY EXTENSION_PREFIX the committed `eval/goldens/` corpus was captured
 * under. The corpus was NOT captured under a single prefix: the bulk of it uses
 * the short token `Con` (`ConDemoNoteSubject`, `CustGroup.ConExtension`, …)
 * while `GOLDEN_CAPTURE_PREFIX` — the single-prefix default every caller
 * inherited — is `Contoso`. Because `canonicalizePrefix` requires the prefix to
 * be followed by an uppercase letter, "Contoso" never matches a `Con`-captured
 * identifier (`Con` + `t` is lowercase), so the golden side of a diff was in
 * practice NEVER canonicalised. Scoring then only worked when the operator
 * hand-passed `--golden-prefix Con --actual-prefix Con`, and passing just one of
 * the two produced a false mismatch (`golden="PFXDemoEnumExtProbe"` vs
 * `actual="ConDemoEnumExtProbe"`).
 *
 * Canonicalising against the whole set (longest-first, so `Contoso` is consumed
 * before `Con` can bite into it) makes prefix resolution tolerant instead of
 * requiring the goldens to be renamed — see docs/eval-sweep-findings-2026-07-21.md #2.
 */
export declare const GOLDEN_CAPTURE_PREFIXES: readonly string[];
export { canonicalizePrefix, PREFIX_PLACEHOLDER, type PrefixSpec } from './prefix.js';
/** Compile a path glob (`**`, `*`, literal) to an anchored RegExp. */
export declare function globToRegExp(glob: string): RegExp;
/**
 * Normalise an AOT XML document into a sorted `path → value` map. `ignore` is the
 * per-case glob list from the case spec; built-in ignores are always applied.
 *
 * `prefix` is the EXTENSION_PREFIX in effect for THIS document — pass
 * `GOLDEN_CAPTURE_PREFIX` when normalising a committed golden, and the
 * CURRENT session's configured prefix (e.g. via
 * `resolveRegularObjectPrefixToken()` from src/utils/modelClassifier.ts) when
 * normalising an actual produced artifact — so a prefixed identifier
 * canonicalises to the same placeholder on both sides regardless of which
 * EXTENSION_PREFIX session produced it (see `canonicalizePrefix` above).
 * Defaults to '' (no canonicalisation — legacy literal-string comparison)
 * for callers that don't pass one.
 */
export declare function normalizeAotXml(xml: string, ignore?: string[], prefix?: PrefixSpec): Promise<Map<string, string>>;
/** Render a normalized map as a stable, human-readable string (for snapshots/logs). */
export declare function renderNormalized(map: Map<string, string>): string;
/**
 * Normalise a SET of artifacts (L3/L4 cases that produce several objects, e.g.
 * a SysOperation's Contract + DP + Controller) into ONE combined `path → value`
 * map, each artifact's paths prefixed with `<filename>::`. This lets the
 * existing single-document diff/score machinery (diffNormalized, scoreRun)
 * handle multi-artifact cases unchanged: an entirely missing/extra artifact
 * just shows up as every one of its paths being missing/extra, prefixed.
 *
 * `artifacts` keys are filenames (e.g. "MyContract.metadata.xml") — stable,
 * case-author-chosen identifiers, not full paths. The filename itself is
 * typically the prefixed object name (e.g. "ContosoMyContract.metadata.xml"), so
 * it is reduced to a LOGICAL ARTIFACT KEY (`artifactKeyMap`) that also absorbs
 * the corpus's second, legacy filename convention (unprefixed stem +
 * `.Ax<Type>` infix) — otherwise a golden captured under one prefix/convention
 * and an actual produced under another would combine under different
 * `<filename>::` keys and false-mismatch wholesale.
 */
export declare function normalizeMultiArtifact(artifacts: Record<string, string>, ignore?: string[], prefix?: PrefixSpec): Promise<Map<string, string>>;
//# sourceMappingURL=normalize.d.ts.map