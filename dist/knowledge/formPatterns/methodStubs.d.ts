/**
 * Per-pattern FormRun / datasource lifecycle method stubs.
 *
 * Stubs are correct-signature skeletons with super() calls and TODO markers —
 * injected by generate_smart when includeMethodStubs=true, and exposed
 * through get_form_pattern_spec as lifecycle guidance.
 */
export interface MethodStub {
    name: string;
    /** Complete X++ source, 4-space indented, ready for a CDATA block */
    source: string;
}
export interface PatternMethodStubs {
    formMethods: MethodStub[];
    /** Stubs for the PRIMARY datasource */
    dataSourceMethods: MethodStub[];
    /** Stubs for the LINES datasource (header+lines patterns) */
    linesDataSourceMethods?: MethodStub[];
}
/**
 * Lifecycle stubs appropriate for a pattern. `dsName` is the primary
 * datasource name; `linesDsName` (optional) the lines datasource for
 * header+lines patterns (used to default line fields from the header).
 */
export declare function methodStubsForPattern(patternName: string, dsName: string, linesDsName?: string): PatternMethodStubs;
/**
 * Inject method stubs into AxForm XML (string-level, format-preserving):
 *  - form methods: appended after the classDeclaration </Method> inside
 *    SourceCode > Methods
 *  - datasource methods: inserted into the SourceCode > DataSources >
 *    DataSource > Methods mirror section (merged when a <DataSource> for the
 *    target datasource already exists), NOT the top-level
 *    DataSources > AxFormDataSource element — no shipped D365FO form ever
 *    populates a <Methods> child there, and doing so desyncs xppc's
 *    positional schema binding for that element (the following <Table> then
 *    deserializes as empty — "datasource 'X' refers to table '' which does
 *    not exist" — even though the emitted <Table> text is correct).
 *
 * Returns the new XML and the names of injected methods.
 */
export declare function injectMethodStubs(xml: string, stubs: PatternMethodStubs, dsName: string, linesDsName?: string): {
    xml: string;
    injected: string[];
};
//# sourceMappingURL=methodStubs.d.ts.map