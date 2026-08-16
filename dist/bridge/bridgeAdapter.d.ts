/**
 * Bridge Adapter — Converts C# bridge responses into the markdown format
 * expected by MCP tool handlers.
 *
 * Each function returns a pre-formatted MCP tool result (content array)
 * or null if the bridge couldn't provide the data.
 *
 * Usage pattern inside a tool handler:
 *   const bridgeResult = await tryBridgeTable(context.bridge, tableName, methodOffset);
 *   if (bridgeResult) return bridgeResult;
 *   // ... fallback to SQLite/parser ...
 *
 * ERROR CONTRACT — `null` means "the bridge is not in play, or it answered and the
 * object is not there". It does NOT mean "the bridge blew up": a thrown call goes
 * through `recordBridgeFailure`, which keeps the reason on the current tool call so
 * the dispatcher can label the index fallback instead of letting a bridge outage
 * pass for a missing object. The few wrappers whose caller must act differently on a
 * failure (create/resolve — they fall back to XML generation and would otherwise
 * report ✅ for a write the bridge never performed) return `BridgeAttempt<T>` and
 * hand back the `BridgeFailure` itself; discriminate with `isBridgeFailure` before
 * the truthiness check.
 */
import type { BridgeClient } from './bridgeClient.js';
import type { BridgeAttempt } from './bridgeFailure.js';
import type { BridgeSmartTableResult } from './bridgeTypes.js';
/** Standard MCP tool response shape */
export interface ToolResult {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
}
export declare function tryBridgeTable(bridge: BridgeClient | undefined, tableName: string, methodOffset?: number, fieldsOffset?: number, fieldFilter?: string): Promise<ToolResult | null>;
export declare function tryBridgeClass(bridge: BridgeClient | undefined, className: string, compact: boolean, methodOffset?: number): Promise<ToolResult | null>;
/**
 * The one-line signature shown per method in the compact class view.
 *
 * This used to be `source.split('\n')[0]`, which for any method whose body opens
 * with an XML doc comment rendered the METHOD NAME as `/// <summary>`: on
 * Foundation's CustVendVoucher, 14 of the first 15 methods came out that way
 * (L2-datetime-timezone-range run). Every documented platform class was
 * therefore unreadable through the default grounding path, while the sibling
 * `options={members:"names"}` path answered correctly.
 *
 * The declaration is located with the shared X++ parser, which handles
 * parameter lists wrapped across lines; only if that fails do we fall back to
 * the first line that is neither blank, nor a comment, nor an attribute — and
 * finally to the name the metadata itself carries, which is never wrong.
 */
export declare function methodSignatureLine(name: string, source?: string): string;
export declare function tryBridgeMethodSource(bridge: BridgeClient | undefined, className: string, methodName: string): Promise<ToolResult | null>;
export declare function tryBridgeEnum(bridge: BridgeClient | undefined, enumName: string): Promise<ToolResult | null>;
export declare function tryBridgeEdt(bridge: BridgeClient | undefined, edtName: string): Promise<ToolResult | null>;
export declare function tryBridgeForm(bridge: BridgeClient | undefined, formName: string, maxControls?: number): Promise<ToolResult | null>;
/**
 * Outcome of a bridge where-used lookup. The caller must distinguish a clean
 * empty result (authoritative "no references") from an error or an unavailable
 * bridge — in the latter cases falling back to the name-only FTS scan is right,
 * but for a clean empty it must NOT (that would re-introduce the over-reporting).
 */
export type BridgeReferencesOutcome = {
    status: 'ok';
    result: ToolResult;
} | {
    status: 'empty';
} | {
    status: 'error';
} | {
    status: 'unavailable';
};
export declare function tryBridgeReferences(bridge: BridgeClient | undefined, target: string | string[], limit?: number, displayName?: string, formatAs?: 'default' | 'label'): Promise<BridgeReferencesOutcome>;
export interface BridgeSearchOptions {
    /**
     * Exact-name hits the caller already resolved from the SQLite index with an
     * index-safe probe. Used to repair defect #15: the bridge fills its result
     * window in provider-enumeration order and truncates at maxResults, so an
     * exact match can be missing entirely. Any candidate absent from the bridge
     * window is spliced in and ranked first.
     */
    exactMatches?: Array<{
        name: string;
        type: string;
    }>;
    /**
     * Keyword hits from CUSTOM/ISV models the caller resolved from the SQLite
     * index (model-scoped, FTS-driven). The bridge enumerates a single merged
     * key list dominated by Microsoft standard objects and truncates at
     * maxResults, so custom matches that enumerate later never reach the client.
     * These are spliced in and ranked directly after the exact matches (ahead of
     * Microsoft standard hits) so custom code is always visible.
     */
    customMatches?: Array<{
        name: string;
        type: string;
    }>;
}
export declare function tryBridgeSearch(bridge: BridgeClient | undefined, query: string, objectType?: string, maxResults?: number, opts?: BridgeSearchOptions): Promise<ToolResult | null>;
export declare function tryBridgeQuery(bridge: BridgeClient | undefined, queryName: string): Promise<ToolResult | null>;
export declare function tryBridgeView(bridge: BridgeClient | undefined, viewName: string): Promise<ToolResult | null>;
export declare function tryBridgeDataEntity(bridge: BridgeClient | undefined, entityName: string): Promise<ToolResult | null>;
export declare function tryBridgeReport(bridge: BridgeClient | undefined, reportName: string): Promise<ToolResult | null>;
/**
 * Refreshes the C# DiskProvider so it picks up newly written/modified files.
 * Returns elapsed time in ms, or null if bridge is unavailable.
 */
export declare function bridgeRefreshProvider(bridge: BridgeClient | undefined): Promise<{
    refreshed: boolean;
    elapsedMs: number;
} | null>;
/**
 * Validates a just-written D365FO object by asking IMetadataProvider to read it back.
 * Automatically refreshes the provider first so the new file is visible.
 * Returns a validation summary or null if bridge is unavailable.
 */
export declare function bridgeValidateAfterWrite(bridge: BridgeClient | undefined, objectType: string, objectName: string): Promise<string | null>;
export interface BridgeResolvedObject {
    exists: boolean;
    objectType: string;
    objectName: string;
    model?: string;
}
/**
 * Resolves object existence and model via IMetadataProvider.
 * Used to locate objects without the SQLite index.
 *
 * Returns the resolution, `null` when the bridge is not in play, or a
 * `BridgeFailure` when the call threw. The distinction matters more here than
 * anywhere else in this file: the payload's whole content is `exists`, so a
 * `null`-on-throw reads as "this object does not exist" — the literal shape of the
 * historical "could not resolve" reports.
 */
export declare function bridgeResolveObject(bridge: BridgeClient | undefined, objectType: string, objectName: string): Promise<BridgeAttempt<BridgeResolvedObject>>;
/**
 * Names the properties the bridge could not write, for appending to a success message.
 *
 * The C# side has reported `unsupportedProperties` for a while, but nothing on this side
 * read it: an EDT whose stringSize had nowhere to go, or a Group control that cannot hold
 * the DataSource it was handed, still produced a bare ✅. Reporting it in C# and dropping
 * it here is the same silence with more steps.
 */
export declare function unappliedSuffix(result: {
    unsupportedProperties?: string[];
}): string;
/**
 * Checks if bridge can handle this create operation.
 */
export declare function canBridgeCreate(objectType: string): boolean;
/**
 * Checks if bridge can handle this modify operation.
 */
export declare function canBridgeModify(objectType: string, operation: string): boolean;
/**
 * Creates a D365FO object via the C# bridge (IMetadataProvider.Create()).
 *
 * Returns { success, filePath, message }, `null` when the bridge is unavailable or
 * the type is not a bridge-create type, or a `BridgeFailure` when the create threw.
 * The caller falls back to XML generation in all three cases — but only the third
 * means the object it is about to hand-write skipped IMetadataProvider entirely,
 * which is what the ✅ has to admit (the XML templates carry fewer collections than
 * the bridge does).
 */
export declare function bridgeCreateObject(bridge: BridgeClient | undefined, params: {
    objectType: string;
    objectName: string;
    modelName: string;
    declaration?: string;
    methods?: {
        name: string;
        source?: string;
    }[];
    fields?: Record<string, unknown>[];
    fieldGroups?: Record<string, unknown>[];
    indexes?: Record<string, unknown>[];
    relations?: Record<string, unknown>[];
    values?: Record<string, unknown>[];
    properties?: Record<string, string>;
}): Promise<BridgeAttempt<{
    success: boolean;
    filePath?: string;
    message: string;
}>>;
/**
 * Creates a smart table via the C# bridge with all BP-smart defaults
 * (CacheLookup, FieldGroups, DeleteActions, TitleField, PrimaryIndex) auto-set.
 *
 * Returns the result, `null` when the bridge is unavailable or declined, or a
 * `BridgeFailure` when the call threw — same reasoning as bridgeCreateObject: the
 * XML fallback that follows writes none of those BP defaults, so "the bridge threw"
 * has to reach the caller's message.
 */
export declare function bridgeCreateSmartTable(bridge: BridgeClient | undefined, params: {
    objectName: string;
    modelName: string;
    tableGroup?: string;
    tableType?: string;
    label?: string;
    fields?: Record<string, unknown>[];
    extraFieldGroups?: Record<string, unknown>[];
    indexes?: Record<string, unknown>[];
    relations?: Record<string, unknown>[];
    methods?: {
        name: string;
        source?: string;
    }[];
    extraProperties?: Record<string, string>;
}): Promise<BridgeAttempt<BridgeSmartTableResult>>;
/**
 * Adds/replaces a method via the C# bridge (IMetadataProvider.Update()).
 */
export declare function bridgeAddMethod(bridge: BridgeClient | undefined, objectType: string, objectName: string, methodName: string, sourceCode: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Adds a field to a table, table-extension or data-entity-view-extension via the C#
 * bridge (IMetadataProvider.Update()).
 *
 * `mapped` carries the data-entity mapped-field binding. A mapped field has no EDT and
 * no base type — it points at a field on one of the entity's data sources — so passing
 * it switches the bridge to the AxDataEntityViewMappedField path.
 */
export declare function bridgeAddField(bridge: BridgeClient | undefined, tableName: string, fieldName: string, fieldType: string, edt?: string, mandatory?: boolean, label?: string, mapped?: {
    dataField?: string;
    dataSource?: string;
    fieldGroupName?: string;
}): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Sets a property via the C# bridge (IMetadataProvider.Update()).
 */
export declare function bridgeSetProperty(bridge: BridgeClient | undefined, objectType: string, objectName: string, propertyPath: string, propertyValue: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Replaces code in a method via the C# bridge (IMetadataProvider.Update()).
 */
export declare function bridgeReplaceCode(bridge: BridgeClient | undefined, objectType: string, objectName: string, methodName: string | undefined, oldCode: string, newCode: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Removes a method from a class, table, form, etc. via the C# bridge.
 */
export declare function bridgeRemoveMethod(bridge: BridgeClient | undefined, objectType: string, objectName: string, methodName: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Adds an index to a table via the C# bridge.
 */
export declare function bridgeAddIndex(bridge: BridgeClient | undefined, tableName: string, indexName: string, fields?: string[], allowDuplicates?: boolean, alternateKey?: boolean): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Removes an index from a table via the C# bridge.
 */
export declare function bridgeRemoveIndex(bridge: BridgeClient | undefined, tableName: string, indexName: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Adds a full-text index to a table or table-extension via the C# bridge.
 *
 * <FullTextIndexes> is a separate collection with a separate element type
 * (AxTableFullTextIndex), so add-index could never reach it.
 */
export declare function bridgeAddFullTextIndex(bridge: BridgeClient | undefined, tableName: string, indexName: string, fields?: string[]): Promise<{
    success: boolean;
    message: string;
} | null>;
/** Removes a full-text index from a table or table-extension via the C# bridge. */
export declare function bridgeRemoveFullTextIndex(bridge: BridgeClient | undefined, tableName: string, indexName: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/** Adds a Map membership to a table or table-extension via the C# bridge. */
export declare function bridgeAddTableMapping(bridge: BridgeClient | undefined, tableName: string, mapName: string, mappingTable?: string, connections?: Array<{
    mapField?: string;
    mapFieldTo?: string;
}>): Promise<{
    success: boolean;
    message: string;
} | null>;
/** Removes a Map membership from a table or table-extension via the C# bridge. */
export declare function bridgeRemoveTableMapping(bridge: BridgeClient | undefined, tableName: string, mapName: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Adds a relation to a table via the C# bridge.
 */
export declare function bridgeAddRelation(bridge: BridgeClient | undefined, tableName: string, relationName: string, relatedTable: string, constraints?: Array<{
    field?: string;
    relatedField?: string;
}>, properties?: {
    relationCardinality?: string;
    relatedTableCardinality?: string;
    relationshipType?: string;
}): Promise<{
    success: boolean;
    message: string;
    propertiesWritten?: boolean;
} | null>;
/**
 * Removes a relation from a table via the C# bridge.
 */
export declare function bridgeRemoveRelation(bridge: BridgeClient | undefined, tableName: string, relationName: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Adds a field group to a table via the C# bridge.
 */
export declare function bridgeAddFieldGroup(bridge: BridgeClient | undefined, tableName: string, groupName: string, label?: string, fields?: string[]): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Removes a field group from a table via the C# bridge.
 */
export declare function bridgeRemoveFieldGroup(bridge: BridgeClient | undefined, tableName: string, groupName: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Adds a field to an existing field group on a table via the C# bridge.
 */
export declare function bridgeAddFieldToFieldGroup(bridge: BridgeClient | undefined, tableName: string, groupName: string, fieldName: string, extendBaseFieldGroup?: boolean): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Modifies field properties on a table via the C# bridge.
 */
export declare function bridgeModifyField(bridge: BridgeClient | undefined, tableName: string, fieldName: string, properties?: Record<string, string>): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Renames a field on a table via the C# bridge. Also fixes index/fieldgroup/TitleField refs.
 */
export declare function bridgeRenameField(bridge: BridgeClient | undefined, tableName: string, oldName: string, newName: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Removes a field from a table via the C# bridge.
 */
export declare function bridgeRemoveField(bridge: BridgeClient | undefined, tableName: string, fieldName: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Replaces ALL fields on a table via the C# bridge. Use for bulk field rewrite.
 */
export declare function bridgeReplaceAllFields(bridge: BridgeClient | undefined, tableName: string, fields: Array<Record<string, unknown>>): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Adds a value to an enum via the C# bridge.
 */
export declare function bridgeAddEnumValue(bridge: BridgeClient | undefined, enumName: string, valueName: string, value: number, label?: string, countryRegionCodes?: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Modifies an enum value's properties via the C# bridge.
 */
export declare function bridgeModifyEnumValue(bridge: BridgeClient | undefined, enumName: string, valueName: string, properties?: Record<string, string>): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Removes an enum value via the C# bridge.
 */
export declare function bridgeRemoveEnumValue(bridge: BridgeClient | undefined, enumName: string, valueName: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Adds a control to a form via the C# bridge.
 */
export declare function bridgeAddControl(bridge: BridgeClient | undefined, formName: string, controlName: string, parentControl: string, controlType: string, dataSource?: string, dataField?: string, label?: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Adds a data source to a form via the C# bridge.
 */
export declare function bridgeAddDataSource(bridge: BridgeClient | undefined, objectType: string, objectName: string, dsName: string, table: string, joinSource?: string, linkType?: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Adds or updates a FieldModification entry in a table-extension via the C# bridge.
 * Allows overriding Label / Mandatory on a base-table field.
 */
export declare function bridgeAddFieldModification(bridge: BridgeClient | undefined, extensionName: string, fieldName: string, fieldLabel?: string, fieldMandatory?: boolean): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Adds a menu item reference to a menu via the C# bridge.
 */
export declare function bridgeAddMenuItemToMenu(bridge: BridgeClient | undefined, menuName: string, menuItemToAdd: string, menuItemToAddType?: string): Promise<{
    success: boolean;
    message: string;
} | null>;
/**
 * Executes multiple write operations on a single object in one bridge call.
 * Returns a formatted ToolResult or null if bridge unavailable.
 */
export declare function bridgeBatchModify(bridge: BridgeClient | undefined, objectType: string, objectName: string, operations: Array<{
    operation: string;
    params?: Record<string, unknown>;
}>): Promise<ToolResult | null>;
/**
 * Retrieves the structured capabilities map from the C# bridge.
 * Returns a formatted ToolResult or null if bridge unavailable.
 */
export declare function bridgeGetCapabilities(bridge: BridgeClient | undefined): Promise<ToolResult | null>;
/**
 * Discovers available D365FO form patterns from the Patterns DLL or fallback list.
 * Returns a formatted ToolResult or null if bridge unavailable.
 */
export declare function bridgeDiscoverFormPatterns(bridge: BridgeClient | undefined): Promise<ToolResult | null>;
export declare function tryBridgeSecurityArtifact(bridge: BridgeClient | undefined, name: string, artifactType: 'privilege' | 'duty' | 'role', includeChain: boolean): Promise<ToolResult | null>;
export declare function tryBridgeMenuItem(bridge: BridgeClient | undefined, name: string, itemType?: string): Promise<ToolResult | null>;
export declare function tryBridgeTableExtensions(bridge: BridgeClient | undefined, baseTableName: string): Promise<ToolResult | null>;
export declare function tryBridgeCompletion(bridge: BridgeClient | undefined, symbolName: string, prefix?: string, ancestors?: string[]): Promise<ToolResult | null>;
export declare function tryBridgeCocExtensions(bridge: BridgeClient | undefined, baseClassName: string, methodName?: string): Promise<ToolResult | null>;
export declare function tryBridgeEventHandlers(bridge: BridgeClient | undefined, targetName: string, eventName?: string, handlerType?: string): Promise<ToolResult | null>;
export declare function tryBridgeApiUsageCallers(bridge: BridgeClient | undefined, apiName: string, limit?: number): Promise<ToolResult | null>;
//# sourceMappingURL=bridgeAdapter.d.ts.map