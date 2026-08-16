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
import { FORM_PATTERN_CATALOG, resolvePatternExact, resolveSubPattern } from './index.js';
/** True when the form_patterns table has mined data (cached per index instance). */
export function hasMinedPatternData(db) {
    try {
        const row = db.prepare(`SELECT COUNT(*) AS c FROM form_patterns`).get();
        return (row?.c ?? 0) > 0;
    }
    catch {
        return false; // table missing — index built by an older version
    }
}
export function crossCheckPatternCatalog(db) {
    if (!hasMinedPatternData(db))
        return null;
    const designRows = db.prepare(`
    SELECT pattern, pattern_version, COUNT(*) AS forms
    FROM form_patterns WHERE node_path = 'Design'
    GROUP BY pattern, pattern_version
  `).all();
    const subRows = db.prepare(`
    SELECT pattern, COUNT(*) AS containers
    FROM form_patterns WHERE node_path != 'Design'
    GROUP BY pattern
  `).all();
    const totalForms = db.prepare(`
    SELECT COUNT(DISTINCT form_name) AS c FROM form_patterns WHERE node_path = 'Design'
  `).get()?.c ?? 0;
    const report = {
        minedFormCount: totalForms,
        catalogGaps: [],
        subPatternGaps: [],
        unusedCatalogEntries: [],
        versionDrift: [],
    };
    const gapCounts = new Map();
    const usedPatterns = new Set();
    for (const row of designRows) {
        const spec = resolvePatternExact(row.pattern);
        if (!spec) {
            gapCounts.set(row.pattern, (gapCounts.get(row.pattern) ?? 0) + row.forms);
            continue;
        }
        usedPatterns.add(spec.xmlName.toLowerCase());
        if (row.pattern_version && !spec.versions.includes(row.pattern_version)) {
            report.versionDrift.push({ pattern: spec.xmlName, version: row.pattern_version, forms: row.forms });
        }
    }
    report.catalogGaps = [...gapCounts.entries()]
        .map(([pattern, forms]) => ({ pattern, forms }))
        .sort((a, b) => b.forms - a.forms);
    for (const row of subRows) {
        const sp = resolveSubPattern(row.pattern);
        if (!sp) {
            report.subPatternGaps.push({ pattern: row.pattern, containers: row.containers });
        }
        else {
            usedPatterns.add(sp.xmlName.toLowerCase());
        }
    }
    report.subPatternGaps.sort((a, b) => b.containers - a.containers);
    for (const spec of [...FORM_PATTERN_CATALOG.patterns, ...FORM_PATTERN_CATALOG.subPatterns]) {
        if (!usedPatterns.has(spec.xmlName.toLowerCase())) {
            report.unusedCatalogEntries.push(spec.xmlName);
        }
    }
    return report;
}
export function formatCrossCheckReport(report) {
    const lines = [];
    lines.push(`Form pattern catalog cross-check (${report.minedFormCount} patterned forms mined):`);
    if (report.catalogGaps.length === 0 && report.subPatternGaps.length === 0 && report.versionDrift.length === 0) {
        lines.push('   OK  All mined patterns and versions are covered by the catalog.');
    }
    if (report.catalogGaps.length > 0) {
        lines.push(`   [!] Patterns missing from the catalog (top ${Math.min(10, report.catalogGaps.length)}):`);
        for (const gap of report.catalogGaps.slice(0, 10)) {
            lines.push(`      - ${gap.pattern} (${gap.forms} forms)`);
        }
    }
    if (report.subPatternGaps.length > 0) {
        lines.push(`   [!] Sub-patterns missing from the catalog (top ${Math.min(10, report.subPatternGaps.length)}):`);
        for (const gap of report.subPatternGaps.slice(0, 10)) {
            lines.push(`      - ${gap.pattern} (${gap.containers} containers)`);
        }
    }
    if (report.versionDrift.length > 0) {
        lines.push('   [!] Version drift (mined version not in catalog -- update versions[] after verifying):');
        for (const drift of report.versionDrift.slice(0, 10)) {
            lines.push(`      - ${drift.pattern} v${drift.version} (${drift.forms} forms)`);
        }
    }
    if (report.unusedCatalogEntries.length > 0) {
        lines.push(`   [i] Catalog entries with zero mined usage (possible xmlName mismatch or unused area): ` +
            report.unusedCatalogEntries.join(', '));
    }
    return lines.join('\n');
}
//# sourceMappingURL=crossCheck.js.map