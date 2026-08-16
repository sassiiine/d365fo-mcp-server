/**
 * Catalog ↔ mined-data cross-check.
 *
 * Compares the curated form pattern catalog against the form_patterns table
 * mined from real metadata during build-database. Surfaces:
 *   - catalog gaps     : patterns used by real forms but unknown to the catalog
 *   - suspect entries  : catalog patterns with zero mined usage (possible
 *                        xmlName typo or environment without that area)
 *   - version drift    : mined PatternVersions missing from the catalog's
 *                        versions list (platform updates bumping versions)
 */
export interface CrossCheckReport {
    minedFormCount: number;
    /** mined pattern → usage count, unknown to the catalog (top-level Design only) */
    catalogGaps: Array<{
        pattern: string;
        forms: number;
    }>;
    /** mined sub-pattern → usage count, unknown to the catalog */
    subPatternGaps: Array<{
        pattern: string;
        containers: number;
    }>;
    /** catalog xmlNames with zero mined usage */
    unusedCatalogEntries: string[];
    /** known pattern, mined version not in the catalog versions list */
    versionDrift: Array<{
        pattern: string;
        version: string;
        forms: number;
    }>;
}
interface ReadDbLike {
    prepare(sql: string): {
        all(...params: unknown[]): unknown[];
        get(...params: unknown[]): unknown;
    };
}
/** True when the form_patterns table has mined data (cached per index instance). */
export declare function hasMinedPatternData(db: ReadDbLike): boolean;
export declare function crossCheckPatternCatalog(db: ReadDbLike): CrossCheckReport | null;
export declare function formatCrossCheckReport(report: CrossCheckReport): string;
export {};
//# sourceMappingURL=crossCheck.d.ts.map