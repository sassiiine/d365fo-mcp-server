/**
 * Eval golden oracle — orchestrator.
 *
 * Given a case spec, the actual produced XML, the golden XML, and the build
 * result, compute the structural golden diff and the scorecard. VM-free: this is
 * the piece the improver/CI runs without the D365FO platform.
 */
import { normalizeAotXml, normalizeMultiArtifact } from './normalize.js';
import { diffNormalized } from './diff.js';
import { scoreRun } from './score.js';
export { normalizeAotXml, normalizeMultiArtifact, renderNormalized, globToRegExp, GOLDEN_CAPTURE_PREFIX, GOLDEN_CAPTURE_PREFIXES, canonicalizePrefix, } from './normalize.js';
export { artifactKey, artifactKeyMap } from './artifactKey.js';
export { diffNormalized, renderDiff } from './diff.js';
export { scoreRun } from './score.js';
export { parseSysTestResult } from './systest.js';
export async function evaluate(input) {
    const { caseSpec, actualXml, goldenXml, build, systest } = input;
    const goldenPrefix = input.goldenPrefix ?? '';
    const actualPrefix = input.actualPrefix ?? '';
    const ignore = caseSpec.ignore ?? [];
    const [expected, actual] = await Promise.all([
        normalizeAotXml(goldenXml, ignore, goldenPrefix),
        normalizeAotXml(actualXml, ignore, actualPrefix),
    ]);
    const goldenDiff = diffNormalized(expected, actual);
    const score = scoreRun({ build, goldenDiff, tier: caseSpec.tier, systest });
    const systestOut = systest && 'ran' in systest
        ? systest
        : { ran: false, passed: null, failures: [] };
    return { goldenDiff, score, systest: systestOut };
}
/**
 * Multi-artifact variant of `evaluate` for L3/L4 cases that produce several
 * objects (e.g. a SysOperation's Contract + DP + Controller, or a data entity +
 * its security chain). Each artifact's normalized paths are prefixed with
 * `<filename>::` and merged into one combined map, then diffed/scored with the
 * same single-document machinery — a wholly missing or extra artifact shows up
 * as every one of its paths being missing/extra under that prefix.
 */
export async function evaluateMulti(input) {
    const { caseSpec, actualArtifacts, goldenArtifacts, build, systest } = input;
    const goldenPrefix = input.goldenPrefix ?? '';
    const actualPrefix = input.actualPrefix ?? '';
    const ignore = caseSpec.ignore ?? [];
    const [expected, actual] = await Promise.all([
        normalizeMultiArtifact(goldenArtifacts, ignore, goldenPrefix),
        normalizeMultiArtifact(actualArtifacts, ignore, actualPrefix),
    ]);
    const goldenDiff = diffNormalized(expected, actual);
    const score = scoreRun({ build, goldenDiff, tier: caseSpec.tier, systest });
    const systestOut = systest && 'ran' in systest
        ? systest
        : { ran: false, passed: null, failures: [] };
    return { goldenDiff, score, systest: systestOut };
}
//# sourceMappingURL=index.js.map