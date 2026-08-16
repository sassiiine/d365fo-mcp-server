/**
 * The version published under the `latest` dist-tag, or null when the registry
 * cannot be reached, answers with an error, or returns something unexpected.
 *
 * The dist-tags endpoint is used rather than the package document: it answers
 * with a few dozen bytes instead of several megabytes of release metadata.
 */
export declare function fetchLatestVersion(timeoutMs?: number): Promise<string | null>;
/**
 * True when `current` is strictly behind `latest`.
 *
 * Only the major.minor.patch triple is compared. A prerelease is treated as
 * its release version, so 1.2.0-rc.1 does not report itself as behind 1.2.0 —
 * whoever installed a prerelease did it deliberately and does not need to be
 * nagged onto the release they were testing against.
 */
export declare function isBehind(current: string, latest: string): boolean;
export interface ReleaseStatus {
    current: string;
    /** null when the registry could not be reached. */
    latest: string | null;
    behind: boolean;
}
/** Compare the running version against the registry. Never throws. */
export declare function checkRelease(timeoutMs?: number): Promise<ReleaseStatus>;
//# sourceMappingURL=npmRegistry.d.ts.map