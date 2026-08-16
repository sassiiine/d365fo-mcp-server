/**
 * properties.dataSource — REQUIRED for a functional query: the root table.
 * `table` is accepted as an alias (regression: eval/corpus/runs/
 * 2026-07-06T18__L1-query-view-basic__cb1b73d.json — `query` had NO entry in
 * the d365fo_file properties documentation, so a caller reasonably guessed
 * `table` mirroring data-entity's `primaryTable` convention, and the root
 * datasource was silently never created).
 */
export declare function buildAxQueryXml(queryName: string, properties?: Record<string, any>): string;
/**
 * Extract the root data source NAME from an AxQuery document.
 *
 * A view's `<DataSource>` must name the query's root data source — NOT the query
 * itself. Exported so the create path can resolve it from the query file on disk.
 */
export declare function extractQueryRootDataSourceName(queryXml: string): string | undefined;
/**
 * properties.query               — name of an existing AxQuery this view is built on.
 * properties.dataSource          — that query's root datasource NAME.
 * properties.queryRootDataSource — same thing, resolved by the caller from the
 *                                   query on disk (see extractQueryRootDataSourceName).
 * properties.queryXml            — the referenced query's raw XML; the root
 *                                   datasource name is read out of it.
 * properties.fields              — [{ name, dataField? }] → one AxViewFieldBound
 *                                   per entry, dataField defaults to name.
 *
 * Resolution order is deliberate: an explicit `dataSource` wins, then a resolved
 * root name, then the referenced query's own XML. Only as a LAST resort does it
 * fall back to the query name — which is what it used to do unconditionally, and
 * which is essentially always wrong: buildAxQueryXml names a simple query's root
 * datasource after its TABLE, so a view generated from a `…Query` object bound its
 * fields to a datasource that does not exist
 * (docs/eval-sweep-findings-2026-07-21.md #38; ground truth in
 * eval/goldens/L1-query-view-basic, where the view's DataSource is
 * `ConDemoNoteHeader`, not `ConDemoNoteHeaderQuery`).
 */
export declare function buildAxViewXml(viewName: string, properties?: Record<string, any>): string;
//# sourceMappingURL=queryViewXml.d.ts.map