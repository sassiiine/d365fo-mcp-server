/**
 * Flake detection CLI — print same-sha score disagreements across corpus runs
 * (docs/AGENT_EVAL_LOOP.md §9). VM-free.
 *
 *   tsx src/eval/improver/flakeDetectionCli.ts [--json]
 */
import * as path from 'path';
import { fileURLToPath } from 'url';
import { detectFlakeCandidates, renderFlakeCandidates } from './flakeDetection.js';
import { loadJsonRecords } from './corpusIO.js';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, '..', '..', '..');
function loadRuns() {
    const dir = path.join(REPO_ROOT, 'eval', 'corpus', 'runs');
    return loadJsonRecords(dir, (r) => r != null && typeof r === 'object' && typeof r.run_id === 'string');
}
const asJson = process.argv.includes('--json');
const runs = loadRuns();
const candidates = detectFlakeCandidates(runs);
if (asJson) {
    console.log(JSON.stringify(candidates, null, 2));
}
else {
    console.log(`Loaded ${runs.length} corpus run(s).\n`);
    console.log(renderFlakeCandidates(candidates));
}
//# sourceMappingURL=flakeDetectionCli.js.map