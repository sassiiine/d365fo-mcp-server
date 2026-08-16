/**
 * D365FO Form Pattern Catalog — data model
 *
 * The catalog encodes, as data, what the Visual Studio form-pattern engine
 * enforces: which containers a pattern requires, in which order, what may
 * appear inside them, and which sub-patterns apply to which containers.
 *
 * Sources of truth:
 *   - Microsoft Learn per-pattern guideline docs
 *     (https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/user-interface/form-styles-patterns)
 *   - Reference forms in PackagesLocalDirectory (CustGroup, CustTable, SalesTable, …)
 *   - Mined pattern usage from the symbol index (form_patterns table) cross-checks
 *     the curated entries; exact <Pattern> strings are confirmed by mining.
 *
 * Control types are normalized i:type values: 'AxFormGridControl' → 'Grid'
 * (see normalizeControlType in src/metadata/formPatternMiner.ts). Extension
 * controls resolve to their FormControlExtension name (e.g. 'QuickFilterControl').
 */
/**
 * Input controls allowed inside field-oriented sub-patterns (Fields and Field
 * Groups, …). Normalized i:type names; intentionally generous — exotic but
 * legitimate input types should not produce false errors.
 */
export const INPUT_CONTROL_TYPES = [
    'String',
    'Int',
    'Integer',
    'Int64',
    'Real',
    'Date',
    'UtcDateTime',
    'DateTime',
    'Time',
    'CheckBox',
    'ComboBox',
    'Radio',
    'RadioButton',
    'ReferenceGroup',
    'SegmentedEntry',
    'MultilineText',
    'ListBox',
    'Control', // extension/custom controls (e.g. dimension controls)
];
//# sourceMappingURL=types.js.map