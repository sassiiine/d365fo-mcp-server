/**
 * BridgeClient — Manages the C# D365MetadataBridge child process.
 *
 * Protocol: newline-delimited JSON-RPC over stdin/stdout.
 * Stderr: diagnostics/logging (forwarded to console.error).
 *
 * Lifecycle:
 *   1. `initialize()` — spawns the .exe, waits for "ready" JSON
 *   2. `call(method, params)` — sends a request, returns promise of response
 *   3. `dispose()` — kills the child process
 *
 * The client is designed to be a singleton field on XppServerContext.
 * It is only initialized when running on a Windows VM with D365FO installed.
 */
import { EventEmitter } from 'events';
import type { BridgeReadyPayload, BridgeInfoPayload, BridgeTableInfo, BridgeClassInfo, BridgeEnumInfo, BridgeEdtInfo, BridgeFormInfo, BridgeQueryInfo, BridgeViewInfo, BridgeDataEntityInfo, BridgeReportInfo, BridgeReferenceResult, BridgeSearchResult, BridgeMethodSource, BridgeListResult, BridgeValidateResult, BridgeResolveResult, BridgeRefreshResult, BridgeWriteResult, BridgeSmartTableResult, BridgeBatchOperationRequest, BridgeBatchOperationResult, BridgeCapabilities, BridgeFormPatternDiscoveryResult, BridgeSecurityPrivilegeResult, BridgeSecurityDutyResult, BridgeSecurityRoleResult, BridgeMenuItemResult, BridgeTableExtensionListResult, BridgeCompletionResult, BridgeExtensionClassResult, BridgeEventSubscriberResult, BridgeApiUsageCallersResult } from './bridgeTypes.js';
export type { BridgeReadyPayload, BridgeInfoPayload } from './bridgeTypes.js';
export * from './bridgeTypes.js';
export declare const READY_TIMEOUT_MS: number;
/**
 * Errors that indicate a transient transport problem (vs. a deterministic bridge error).
 *
 * Exported for the lifecycle test, which derives the message the child-exit handler
 * actually produces and checks it lands here: the two used to disagree. This matched
 * only the phrase "exited unexpectedly", which no code path ever emitted — the exit
 * handler said "Bridge process exited before becoming ready", so a child that crashed
 * with a READ in flight (the AOS metadata provider dying mid-query is the common case)
 * was classified as a deterministic failure and thrown at the caller instead of being
 * retried against a respawned child.
 */
export declare function isTransientError(err: unknown): boolean;
export interface BridgeClientOptions {
    /** Path to the D365MetadataBridge.exe (auto-detected if omitted) */
    bridgeExePath?: string;
    /** e.g. K:\AosService\PackagesLocalDirectory — the volume varies by VM image */
    packagesPath: string;
    /**
     * Optional secondary packages path.
     * UDE: Microsoft FrameworkDirectory (e.g. %LOCALAPPDATA%\Microsoft\Dynamics365\{ver}\PackagesLocalDirectory).
     * When provided the bridge initialises a second DiskProvider and transparently falls back to it
     * for any object not found in the primary path — so both custom and Microsoft-shipped metadata
     * resolve correctly without having to choose one path over the other.
     */
    referencePackagesPath?: string;
    /**
     * Explicit path to the D365FO bin directory containing Microsoft.Dynamics.*.dll.
     * Traditional: omit — defaults to {packagesPath}/bin.
     * UDE: set to microsoftPackagesPath/bin (the FrameworkDirectory bin folder).
     */
    binPath?: string;
    /** SQL Server instance for cross-references (default: localhost) */
    xrefServer?: string;
    /** XRef database name (default: DYNAMICSXREFDB) */
    xrefDatabase?: string;
    /** Timeout for the ready signal in ms */
    readyTimeoutMs?: number;
    /** Timeout for each RPC call in ms */
    callTimeoutMs?: number;
    /** Path to a log file for bridge diagnostics (append mode) */
    logFile?: string;
    /** Max automatic retries for READ calls on timeout/pipe error (default: BRIDGE_MAX_RETRIES env or 2) */
    maxRetries?: number;
    /** Idle ping interval in ms, 0 = disabled (default: BRIDGE_HEALTHCHECK_MS env or 0) */
    healthcheckMs?: number;
    /** Max child respawns per 60s before giving up (default: BRIDGE_MAX_RESTARTS env or 3) */
    maxRestarts?: number;
}
export declare class BridgeClient extends EventEmitter {
    private process;
    private buffer;
    private requestId;
    private pending;
    private readyPayload;
    private _isReady;
    private _disposed;
    private restartPromise;
    private restartTimestamps;
    private healthTimer;
    readonly options: BridgeClientOptions;
    constructor(options: BridgeClientOptions);
    /** Whether the bridge process is running and the metadata provider initialized */
    get isReady(): boolean;
    /** Whether the MS metadata API is available (set after ready) */
    get metadataAvailable(): boolean;
    /** Whether the cross-reference DB is available (set after ready) */
    get xrefAvailable(): boolean;
    /** The ready payload from the bridge process */
    get ready(): BridgeReadyPayload | null;
    /**
     * Spawn the C# bridge process and wait for the "ready" message.
     * Resolves with the BridgeReadyPayload on success.
     * Rejects if the process fails to start or doesn't send ready in time.
     */
    initialize(): Promise<BridgeReadyPayload>;
    /** Spawn the child process and wait for its "ready" message. Used by initialize() and restart(). */
    private spawnAndWaitReady;
    /**
     * Send a JSON-RPC call to the bridge and return the result.
     * Rejects if bridge is not ready, the call times out, or the bridge returns an error.
     *
     * READ methods (RETRYABLE_METHODS) are transparently retried on transient
     * transport failures — timeout, dead pipe, child exit — with jittered
     * exponential backoff and a health-checked restart of the child in between.
     * Write methods are never retried: a timed-out write may have already
     * applied on the bridge side, and replaying it could duplicate the operation.
     */
    call<T = unknown>(method: string, params?: Record<string, unknown>): Promise<T>;
    /** Single-shot RPC send with no retry. */
    private callOnce;
    /**
     * Verify the child is alive and responding; respawn it if not.
     * Called between read-retry attempts and from the idle health-check.
     */
    private ensureHealthy;
    private processAlive;
    /**
     * Tear down the current child and spawn a fresh one. Concurrent callers
     * share a single in-flight restart. Capped at maxRestarts per 60s to avoid
     * crash loops — past the cap the error tells the user where to look.
     */
    restart(): Promise<BridgeReadyPayload>;
    /** Periodic idle ping (BRIDGE_HEALTHCHECK_MS > 0) — proactively respawns a dead/wedged child. */
    private startHealthcheck;
    /**
     * Gracefully shut down the bridge process.
     *
     * Awaitable, and the shutdown coordinator does await it: the escalation below is
     * driven by timers, and unref'd timers scheduled by a synchronous dispose() never
     * get to fire — the process exits first. A child that had gone unresponsive was
     * therefore left running with the packages directory open, so the next server start
     * met a second bridge holding the same metadata, and the user met an orphan they
     * had to find in Task Manager.
     */
    dispose(): Promise<void>;
    /**
     * Kill the current child process (used by dispose and restart), escalating until
     * it is actually gone: end stdin so it can finish an in-flight AOT write, then
     * SIGTERM, then SIGKILL. Resolves when the child exits, or after the last step's
     * budget — shutdown must not be the thing that hangs.
     */
    private killChild;
    ping(): Promise<string>;
    readTable(tableName: string): Promise<BridgeTableInfo | null>;
    readClass(className: string): Promise<BridgeClassInfo | null>;
    readEnum(enumName: string): Promise<BridgeEnumInfo | null>;
    readEdt(edtName: string): Promise<BridgeEdtInfo | null>;
    readForm(formName: string): Promise<BridgeFormInfo | null>;
    readQuery(queryName: string): Promise<BridgeQueryInfo | null>;
    readView(viewName: string): Promise<BridgeViewInfo | null>;
    readDataEntity(entityName: string): Promise<BridgeDataEntityInfo | null>;
    readReport(reportName: string): Promise<BridgeReportInfo | null>;
    getMethodSource(className: string, methodName: string): Promise<BridgeMethodSource>;
    searchObjects(query: string, objectType?: string, maxResults?: number): Promise<BridgeSearchResult>;
    listObjects(type: string): Promise<BridgeListResult>;
    findReferences(targetName: string, targetType?: string): Promise<BridgeReferenceResult>;
    readSecurityPrivilege(name: string): Promise<BridgeSecurityPrivilegeResult | null>;
    readSecurityDuty(name: string): Promise<BridgeSecurityDutyResult | null>;
    readSecurityRole(name: string): Promise<BridgeSecurityRoleResult | null>;
    readMenuItem(name: string, itemType?: string): Promise<BridgeMenuItemResult | null>;
    readTableExtensions(baseTableName: string): Promise<BridgeTableExtensionListResult | null>;
    getCompletionMembers(symbolName: string): Promise<BridgeCompletionResult | null>;
    findExtensionClasses(baseClassName: string): Promise<BridgeExtensionClassResult | null>;
    findEventSubscribers(targetName: string, eventName?: string, handlerType?: string): Promise<BridgeEventSubscriberResult | null>;
    findApiUsageCallers(apiName: string, limit?: number): Promise<BridgeApiUsageCallersResult | null>;
    getInfo(): Promise<BridgeInfoPayload>;
    /** Re-create the DiskProvider so newly written files are picked up. */
    refreshProvider(): Promise<BridgeRefreshResult>;
    /** Ask IMetadataProvider to read back an object — validates the XML is consumable. */
    validateObject(objectType: string, objectName: string): Promise<BridgeValidateResult>;
    /** Check if an object exists in IMetadataProvider and return its model. */
    resolveObjectInfo(objectType: string, objectName: string): Promise<BridgeResolveResult | null>;
    /** Create a D365FO object via IMetadataProvider.Create() */
    createObject(params: {
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
    }): Promise<BridgeWriteResult>;
    /**
     * Create a smart table via C# CreateSmartTable — all BP-smart defaults
     * (CacheLookup, FieldGroups, DeleteActions, TitleField, indexes) are auto-set in C#.
     */
    createSmartTable(params: {
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
    }): Promise<BridgeSmartTableResult>;
    /** Add or replace a method on a class or table via IMetadataProvider.Update() */
    addMethod(objectType: string, objectName: string, methodName: string, sourceCode: string): Promise<BridgeWriteResult>;
    /**
     * Add a field to a table, table-extension or data-entity-view-extension via
     * IMetadataProvider.Update(). dataField/dataSource select the data-entity mapped-field
     * path on the bridge side; fieldGroupName additionally appends it to a base-entity group.
     */
    addField(objectName: string, fieldName: string, fieldType: string, edt?: string, mandatory?: boolean, label?: string, dataField?: string, dataSource?: string, fieldGroupName?: string): Promise<BridgeWriteResult>;
    /** Set a property on any object via IMetadataProvider.Update() */
    setProperty(objectType: string, objectName: string, propertyPath: string, propertyValue: string): Promise<BridgeWriteResult>;
    /** Replace code within a method via IMetadataProvider.Update() */
    replaceCode(objectType: string, objectName: string, methodName: string | undefined, oldCode: string, newCode: string): Promise<BridgeWriteResult>;
    /** Remove a method from a class, table, form, query, or view */
    removeMethod(objectType: string, objectName: string, methodName: string): Promise<BridgeWriteResult>;
    /** Add an index to a table */
    addIndex(tableName: string, indexName: string, fields?: string[], allowDuplicates?: boolean, alternateKey?: boolean): Promise<BridgeWriteResult>;
    /** Remove an index from a table */
    removeIndex(tableName: string, indexName: string): Promise<BridgeWriteResult>;
    /** Add a full-text index to a table or table-extension (a separate collection from Indexes) */
    addFullTextIndex(tableName: string, indexName: string, fields?: string[]): Promise<BridgeWriteResult>;
    /** Remove a full-text index from a table or table-extension */
    removeFullTextIndex(tableName: string, indexName: string): Promise<BridgeWriteResult>;
    /** Add a Map membership to a table or table-extension */
    addTableMapping(tableName: string, mapName: string, mappingTable?: string, connections?: Array<{
        mapField?: string;
        mapFieldTo?: string;
    }>): Promise<BridgeWriteResult>;
    /** Remove a Map membership from a table or table-extension */
    removeTableMapping(tableName: string, mapName: string): Promise<BridgeWriteResult>;
    /**
     * Add a relation to a table.
     *
     * `properties` carries Cardinality / RelatedTableCardinality / RelationshipType —
     * real AxTableRelation properties the bridge now sets through the provider. They
     * used to be dropped on both sides, which is what raised
     * BPErrorTableRelationshipPropertiesCompleteness on a relation reported as added
     * (findings #5 / #35). An invalid value is rejected by the bridge with the list of
     * legal ones rather than silently ignored.
     */
    addRelation(tableName: string, relationName: string, relatedTable: string, constraints?: Array<{
        field?: string;
        relatedField?: string;
    }>, properties?: {
        relationCardinality?: string;
        relatedTableCardinality?: string;
        relationshipType?: string;
    }): Promise<BridgeWriteResult>;
    /** Remove a relation from a table */
    removeRelation(tableName: string, relationName: string): Promise<BridgeWriteResult>;
    /** Add a field group to a table */
    addFieldGroup(tableName: string, groupName: string, label?: string, fields?: string[]): Promise<BridgeWriteResult>;
    /** Remove a field group from a table */
    removeFieldGroup(tableName: string, groupName: string): Promise<BridgeWriteResult>;
    /** Add a field reference to an existing field group */
    addFieldToFieldGroup(tableName: string, groupName: string, fieldName: string, extendBaseFieldGroup?: boolean): Promise<BridgeWriteResult>;
    /** Modify properties of an existing field on a table */
    modifyField(tableName: string, fieldName: string, properties?: Record<string, string>): Promise<BridgeWriteResult>;
    /** Rename a field on a table (also fixes index/fieldgroup/TitleField refs) */
    renameField(tableName: string, oldName: string, newName: string): Promise<BridgeWriteResult>;
    /** Remove a field from a table */
    removeField(tableName: string, fieldName: string): Promise<BridgeWriteResult>;
    /** Replace ALL fields on a table (clear + re-add) */
    replaceAllFields(tableName: string, fields: Array<Record<string, unknown>>): Promise<BridgeWriteResult>;
    /** Add a value to an enum */
    addEnumValue(enumName: string, valueName: string, value: number, label?: string, countryRegionCodes?: string): Promise<BridgeWriteResult>;
    /** Modify an existing enum value's properties */
    modifyEnumValue(enumName: string, valueName: string, properties?: Record<string, string>): Promise<BridgeWriteResult>;
    /** Remove a value from an enum */
    removeEnumValue(enumName: string, valueName: string): Promise<BridgeWriteResult>;
    /** Add a control to a form */
    addControl(formName: string, controlName: string, parentControl: string, controlType: string, dataSource?: string, dataField?: string, label?: string): Promise<BridgeWriteResult>;
    /** Add a data source to a form */
    addDataSource(objectType: string, objectName: string, dsName: string, table: string, joinSource?: string, linkType?: string): Promise<BridgeWriteResult>;
    /** Add/update a field modification in a table-extension (override base-table field label/mandatory) */
    addFieldModification(extensionName: string, fieldName: string, fieldLabel?: string, fieldMandatory?: boolean): Promise<BridgeWriteResult>;
    /** Add a menu item reference to a menu */
    addMenuItemToMenu(menuName: string, menuItemToAdd: string, menuItemToAddType?: string): Promise<BridgeWriteResult>;
    /** Execute multiple write operations on a single object in one call */
    batchModify(objectType: string, objectName: string, operations: BridgeBatchOperationRequest[]): Promise<BridgeBatchOperationResult>;
    /** Get structured capabilities map — lists available operations per object type */
    getCapabilities(): Promise<BridgeCapabilities>;
    /** Discover available D365FO form patterns (runtime DLL or hardcoded fallback) */
    discoverFormPatterns(): Promise<BridgeFormPatternDiscoveryResult>;
    /**
     * Locate the bridge binary.
     *
     * An explicit path wins and is not second-guessed: it is how an npm install
     * finds a binary built outside the package (updating the package deletes
     * anything inside it, and the bridge has to be built per environment — see
     * the metamodel version check in Program.cs), and how one machine can point
     * several configurations at different builds.
     *
     * Everything else falls back to the in-installation search, unchanged.
     */
    private resolveBridgeExe;
    private rejectAllPending;
}
/**
 * Attempt to create and initialize a BridgeClient.
 * Returns null if D365FO is not installed or the bridge exe is missing.
 *
 * This is a non-throwing factory — safe to call during server startup.
 */
export declare function createBridgeClient(options: {
    packagesPath?: string;
    referencePackagesPath?: string;
    binPath?: string;
    bridgeExePath?: string;
    xrefServer?: string;
    xrefDatabase?: string;
    logFile?: string;
}): Promise<BridgeClient | null>;
//# sourceMappingURL=bridgeClient.d.ts.map