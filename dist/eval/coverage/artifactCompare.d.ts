/**
 * Staleness comparison for the generated coverage artifacts.
 *
 * Split out of coverageCli so it can be tested without importing the CLI,
 * which runs `process.exit(main())` at module load.
 */
import type { CoverageReport } from './coverage.js';
export declare const BADGE_START = "<!-- coverage-badge:start -->";
export declare const BADGE_END = "<!-- coverage-badge:end -->";
/**
 * CRLF -> LF. Every staleness comparison runs through this.
 *
 * The artifacts are written with `\n`, but git checks them out with `\r\n`
 * wherever `core.autocrlf=true` (the default on Windows), so the old byte
 * comparison called every such checkout stale — while `git diff` showed
 * nothing, because git normalizes back on the way in. `--check` was dead
 * locally on Windows yet green in CI (ubuntu-latest), and the "obvious" fix —
 * regenerate and commit — commits CRLF artifacts and breaks the gate on Linux
 * instead.
 *
 * Line endings are not content here, so normalize rather than pin them: the
 * gate then holds under any core.autocrlf / .gitattributes setting instead of
 * depending on every clone agreeing.
 */
export declare const normalizeEol: (s: string) => string;
/** A file's dominant line ending, so a rewrite doesn't leave it mixed. */
export declare function dominantEol(s: string): string;
/**
 * The generation timestamp must not make --check fail on an unchanged run.
 * Normalizes first: with CRLF the `$` anchor sits after a stray `\r`, so the
 * strip silently misses and every run looks stale.
 */
export declare function stripGeneratedAt(md: string): string;
/**
 * Rewrites the README badge block from the report. The badge is the public
 * reliability number — generated, never hand-edited, so it cannot quietly
 * disagree with eval/coverage.json.
 */
export declare function withBadge(readme: string, report: CoverageReport): string;
//# sourceMappingURL=artifactCompare.d.ts.map