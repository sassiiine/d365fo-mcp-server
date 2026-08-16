/**
 * Shared builders for AxQuery and AxView XML.
 *
 * createD365File.ts and generateD365Xml.ts each expose a mirrored
 * XmlTemplateGenerator class; both delegate here so the two cannot drift —
 * mirrors the securityPrivilegeXml.ts / dataEntityXml.ts pattern. Both had
 * already drifted for query/view (different root shapes, one used <Label>
 * where AxQuery actually needs <Title>) AND both silently ignored the one
 * property that makes either object functional: a query's `dataSource`
 * (table) and a view's `query` (the AxQuery it's built on). A query/view
 * created via either path previously came out with an empty <DataSources/>
 * or no <Query> reference at all — structurally valid, functionally useless
 * (TOOL_DEFECT, found building eval case Phase 6 query+view).
 *
 * Structure verified against real shipped objects read directly off disk
 * (ApplicationFoundation\AxView\BICompanyView.xml): a view references an
 * external AxQuery by name (<Query>QueryName</Query>) and its own <Fields>
 * are AxViewFieldBound entries pointing at that query's datasource alias —
 * it does NOT normally embed its own ViewMetadata/DataSources.
 */
/** properties.dataSource — REQUIRED for a functional query: the root table. */
export declare function buildAxQueryXml(queryName: string, properties?: Record<string, any>): string;
/**
 * properties.query      — name of an existing AxQuery this view is built on.
 * properties.dataSource  — that query's root datasource NAME (defaults to
 *                           properties.query — matches the common convention
 *                           of naming a simple query's root datasource after
 *                           its table, and matching buildAxQueryXml's default
 *                           dataSourceName when the caller didn't override it).
 * properties.fields      — [{ name, dataField? }] → one AxViewFieldBound per
 *                           entry, dataField defaults to name.
 */
export declare function buildAxViewXml(viewName: string, properties?: Record<string, any>): string;
//# sourceMappingURL=queryViewXml.d.ts.map