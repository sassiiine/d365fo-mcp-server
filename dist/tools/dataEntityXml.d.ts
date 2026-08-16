/**
 * Shared builder for AxDataEntityView XML.
 *
 * createD365File.ts and generateD365Xml.ts each expose a mirrored
 * XmlTemplateGenerator class; both delegate here so the two cannot drift —
 * they had already drifted for data entities (generateD365Xml.ts's copy used
 * a top-level <DataSources/> element that isn't even part of the real
 * AxDataEntityView schema) before this fix, mirroring exactly the problem
 * securityPrivilegeXml.ts was extracted to prevent.
 *
 * Structure verified against a real shipped single-table entity read directly
 * off disk (Currency\AxDataEntityView\CurrencyEntity.xml).
 *
 * properties.primaryTable    – REQUIRED for a functional entity: the root table.
 * properties.fields          – [{ name, dataField? }] one AxDataEntityViewMappedField
 *                               + one query datasource field per entry, both sourced
 *                               from primaryTable. dataField defaults to name.
 * properties.primaryKeyField – field `name` to use as the entity key (default: fields[0].name).
 * properties.entityCategory  – Master | Transaction | Reference | Document | Parameter
 *                               (default: Transaction).
 *
 * Without primaryTable + at least one field, this emits an INERT skeleton
 * (no query) for backward compatibility — that shape can never actually
 * function as a data entity (TOOL_DEFECT, see
 * eval/corpus/runs/2026-06-30T19__L4-entity-security__fc090d0.json), so
 * callers should always pass both.
 */
export declare function buildAxDataEntityXml(entityName: string, properties?: Record<string, any>): string;
//# sourceMappingURL=dataEntityXml.d.ts.map