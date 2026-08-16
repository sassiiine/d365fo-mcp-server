/**
 * Shared builder for AxForm XML.
 *
 * createD365File.ts and generateD365Xml.ts each expose a mirrored
 * XmlTemplateGenerator class; both delegate here so the two cannot drift
 * (mirrors the securityPrivilegeXml.ts / queryViewXml.ts pattern).
 *
 * The generate mirror had drifted all the way to ignoring its input: its
 * parameter was literally named `_properties` and it returned a fixed empty
 * shell — no pattern, no data source, no controls, no caption. Since the
 * documented hybrid flow is generate → create(xmlContent), a caller who asked
 * for a SimpleList form over a table got an empty form on disk, and an empty
 * form builds clean.
 */
/**
 * Build an AxForm from a design pattern.
 *
 * The pattern comes from `properties.pattern` (the design pattern) or
 * `properties.formTemplate` (the VS template name); both are fuzzy strings
 * normalized to a canonical pattern. When neither is given we default to
 * SimpleList — the most common shape for a new setup table.
 */
export declare function buildAxFormXml(formName: string, properties?: Record<string, any>): string;
//# sourceMappingURL=formXml.d.ts.map