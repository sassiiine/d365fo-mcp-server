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
import { spawn } from 'child_process';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { packagesRoots } from '../utils/packagesRoot.js';
export * from './bridgeTypes.js';
const BRIDGE_EXE_NAME = 'D365MetadataBridge.exe';
/** Parse a positive-integer env var with a fallback (ignores invalid/non-positive values). */
function envInt(name, fallback) {
    const raw = process.env[name];
    if (!raw)
        return fallback;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
/** Like envInt but accepts 0 (used by knobs where 0 means "disabled"). */
function envIntZero(name, fallback) {
    const raw = process.env[name];
    if (!raw)
        return fallback;
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}
// Configurable via env so large installations / slow VMs can raise the limits.
// Exported so the readiness gate (bridgeReadiness.ts) bounds its wait by the
// same budget the child process is actually given to come up.
export const READY_TIMEOUT_MS = envInt('BRIDGE_READY_TIMEOUT_MS', 30_000); // 30s for metadata provider init
const CALL_TIMEOUT_MS = envInt('BRIDGE_CALL_TIMEOUT_MS', 60_000); // 60s per call (large searches can take time)
const MAX_RETRIES = envIntZero('BRIDGE_MAX_RETRIES', 2); // retries for READ calls only (0 = disabled)
const HEALTHCHECK_MS = envIntZero('BRIDGE_HEALTHCHECK_MS', 0); // idle ping interval (0 = disabled)
const MAX_RESTARTS = envInt('BRIDGE_MAX_RESTARTS', 3); // max child respawns per minute
const RESTART_WINDOW_MS = 60_000;
const PING_TIMEOUT_MS = 5_000;
const RETRY_BASE_DELAY_MS = 250;
const KILL_GRACE_MS = envInt('BRIDGE_KILL_GRACE_MS', 2_000); // stdin-end → SIGTERM
const KILL_HARD_MS = envInt('BRIDGE_KILL_HARD_MS', 3_000); // SIGTERM → SIGKILL, and SIGKILL → give up
/**
 * Methods safe to auto-retry on timeout/pipe error: idempotent READS only.
 * Writes (create/modify/delete/batch/refresh) must NEVER be retried — the
 * operation may have already applied on the bridge side before the timeout fired.
 */
const RETRYABLE_METHODS = new Set([
    'ping', 'getInfo', 'getCapabilities',
    'readTable', 'readClass', 'readEnum', 'readEdt', 'readForm', 'readQuery',
    'readView', 'readDataEntity', 'readReport', 'readSecurityPrivilege',
    'readSecurityDuty', 'readSecurityRole', 'readMenuItem', 'readTableExtensions',
    'getMethodSource', 'searchObjects', 'listObjects', 'findReferences',
    'getCompletionMembers', 'findExtensionClasses', 'findEventSubscribers',
    'findApiUsageCallers', 'resolveObjectInfo', 'validateObject', 'discoverFormPatterns',
]);
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
export function isTransientError(err) {
    const msg = err instanceof Error ? err.message : String(err);
    return (msg.includes('timed out') ||
        msg.includes('Bridge is not ready') ||
        msg.includes('Bridge process exited') ||
        msg.includes('Bridge process error') ||
        msg.includes('Failed to write to bridge stdin') ||
        msg.includes('Bridge restarting'));
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * True when `promise` settled within `ms`. The timer is cleared on the fast path so
 * a pending kill-escalation deadline cannot hold the event loop open after the child
 * has already exited.
 */
async function settledWithin(promise, ms) {
    let timer;
    const expired = new Promise((resolve) => {
        timer = setTimeout(() => resolve(false), ms);
    });
    try {
        return await Promise.race([promise.then(() => true), expired]);
    }
    finally {
        if (timer)
            clearTimeout(timer);
    }
}
export class BridgeClient extends EventEmitter {
    process = null;
    buffer = '';
    requestId = 0;
    pending = new Map();
    readyPayload = null;
    _isReady = false;
    _disposed = false;
    restartPromise = null;
    restartTimestamps = [];
    healthTimer = null;
    options;
    constructor(options) {
        super();
        this.options = options;
    }
    /** Whether the bridge process is running and the metadata provider initialized */
    get isReady() { return this._isReady && !this._disposed; }
    /** Whether the MS metadata API is available (set after ready) */
    get metadataAvailable() { return this.readyPayload?.metadataAvailable ?? false; }
    /** Whether the cross-reference DB is available (set after ready) */
    get xrefAvailable() { return this.readyPayload?.xrefAvailable ?? false; }
    /** The ready payload from the bridge process */
    get ready() { return this.readyPayload; }
    // Lifecycle
    /**
     * Spawn the C# bridge process and wait for the "ready" message.
     * Resolves with the BridgeReadyPayload on success.
     * Rejects if the process fails to start or doesn't send ready in time.
     */
    async initialize() {
        if (this._disposed)
            throw new Error('BridgeClient has been disposed');
        if (this._isReady)
            return this.readyPayload;
        const payload = await this.spawnAndWaitReady();
        this.startHealthcheck();
        return payload;
    }
    /** Spawn the child process and wait for its "ready" message. Used by initialize() and restart(). */
    async spawnAndWaitReady() {
        const exePath = this.resolveBridgeExe();
        const args = [
            '--packages-path', this.options.packagesPath,
        ];
        if (this.options.referencePackagesPath) {
            args.push('--reference-packages-path', this.options.referencePackagesPath);
        }
        if (this.options.binPath) {
            args.push('--bin-path', this.options.binPath);
        }
        if (this.options.xrefServer) {
            args.push('--xref-server', this.options.xrefServer);
        }
        if (this.options.xrefDatabase) {
            args.push('--xref-database', this.options.xrefDatabase);
        }
        if (this.options.logFile) {
            args.push('--log-file', this.options.logFile);
        }
        console.error(`[BridgeClient] Spawning: ${exePath} ${args.join(' ')}`);
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                // Kill only the child; the client stays usable for a later restart()/dispose().
                // Not awaited — this rejects the ready promise now and lets the escalation
                // run behind it; a later dispose() has nothing left to wait for either way.
                void this.killChild();
                reject(new Error(`Bridge process did not become ready within ${this.options.readyTimeoutMs ?? READY_TIMEOUT_MS}ms`));
            }, this.options.readyTimeoutMs ?? READY_TIMEOUT_MS);
            try {
                this.process = spawn(exePath, args, {
                    stdio: ['pipe', 'pipe', 'pipe'],
                    windowsHide: true,
                });
            }
            catch (err) {
                clearTimeout(timeout);
                reject(new Error(`Failed to spawn bridge: ${err}`));
                return;
            }
            // Capture the child so late events from a replaced (restarted) process cannot
            // corrupt the state of its successor.
            const child = this.process;
            // Streams can emit EPIPE/ECONNRESET if the child dies mid-write. Without a
            // listener that throws as an uncaughtException and kills the whole server, so
            // just log it; recovery is handled by the child's 'error'/'exit' handlers below.
            const onStreamError = (where) => (err) => {
                console.error(`[BridgeClient] ${where} stream error: ${err.message}`);
            };
            child.stdin?.on('error', onStreamError('stdin'));
            child.stdout?.on('error', onStreamError('stdout'));
            child.stderr?.on('error', onStreamError('stderr'));
            // Handle stdout — newline-delimited JSON
            child.stdout.on('data', (chunk) => {
                if (this.process !== child)
                    return;
                this.buffer += chunk.toString('utf8');
                let newlineIdx;
                while ((newlineIdx = this.buffer.indexOf('\n')) !== -1) {
                    const line = this.buffer.substring(0, newlineIdx).trim();
                    this.buffer = this.buffer.substring(newlineIdx + 1);
                    if (!line)
                        continue;
                    try {
                        const msg = JSON.parse(line);
                        // Handle the initial "ready" message
                        if (msg.id === 'ready' && msg.result) {
                            clearTimeout(timeout);
                            this.readyPayload = msg.result;
                            this._isReady = true;
                            console.error(`[BridgeClient] Ready: metadata=${this.readyPayload.metadataAvailable}, xref=${this.readyPayload.xrefAvailable}`);
                            this.emit('ready', this.readyPayload);
                            resolve(this.readyPayload);
                            return;
                        }
                        // Handle RPC responses
                        const pending = this.pending.get(msg.id);
                        if (pending) {
                            this.pending.delete(msg.id);
                            clearTimeout(pending.timer);
                            if (msg.error) {
                                // -32001 "not found" from a read is a normal negative result (T | null),
                                // not a failure; the write path's -32001 keeps a distinct message and rejects.
                                if (msg.error.code === -32001 && /not found/i.test(msg.error.message ?? '')) {
                                    pending.resolve(null);
                                }
                                else {
                                    pending.reject(new Error(`Bridge error [${msg.error.code}]: ${msg.error.message}`));
                                }
                            }
                            else {
                                pending.resolve(msg.result);
                            }
                        }
                    }
                    catch {
                        console.error(`[BridgeClient] Failed to parse line: ${line.substring(0, 200)}`);
                    }
                }
            });
            // Forward stderr for diagnostics
            child.stderr.on('data', (chunk) => {
                const text = chunk.toString('utf8').trim();
                if (text) {
                    for (const line of text.split('\n')) {
                        const trimmed = line.trim();
                        if (!trimmed)
                            continue;
                        // With a log file configured, forward all stderr lines; otherwise only errors/warnings.
                        if (this.options.logFile ||
                            trimmed.includes('[ERROR]') || trimmed.includes('[WARN]')) {
                            console.error(`[Bridge] ${trimmed}`);
                        }
                    }
                }
            });
            child.on('error', (err) => {
                if (this.process !== child)
                    return;
                clearTimeout(timeout);
                this._isReady = false;
                console.error(`[BridgeClient] Process error: ${err.message}`);
                this.rejectAllPending(new Error(`Bridge process error: ${err.message}`));
                reject(err);
            });
            child.on('exit', (code, signal) => {
                if (this.process !== child)
                    return;
                clearTimeout(timeout);
                this._isReady = false;
                console.error(`[BridgeClient] Process exited: code=${code}, signal=${signal}`);
                // Two different audiences, two different truths. The spawn promise only
                // matters before ready, so "before becoming ready" is right there. In-flight
                // calls are the opposite case — the child was up and serving them — and they
                // must get a message isTransientError() recognises, or a read that was in the
                // pipe when the child crashed is reported as a hard failure instead of being
                // retried against a respawned child.
                this.rejectAllPending(new Error(`Bridge process exited unexpectedly: code=${code}, signal=${signal}`));
                reject(new Error(`Bridge process exited before becoming ready: code=${code}, signal=${signal}`));
            });
        });
    }
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
    async call(method, params = {}) {
        const maxRetries = RETRYABLE_METHODS.has(method) ? (this.options.maxRetries ?? MAX_RETRIES) : 0;
        for (let attempt = 0;; attempt++) {
            try {
                if (this.restartPromise)
                    await this.restartPromise;
                return await this.callOnce(method, params);
            }
            catch (err) {
                if (attempt >= maxRetries || this._disposed || !isTransientError(err)) {
                    throw err;
                }
                const delay = RETRY_BASE_DELAY_MS * 2 ** attempt + Math.floor(Math.random() * 100);
                console.error(`[BridgeClient] Read call '${method}' failed (${err instanceof Error ? err.message : err}) — ` +
                    `retry ${attempt + 1}/${maxRetries} in ${delay}ms`);
                await sleep(delay);
                await this.ensureHealthy();
            }
        }
    }
    /** Single-shot RPC send with no retry. */
    callOnce(method, params, timeoutOverrideMs) {
        if (!this._isReady || this._disposed || !this.process?.stdin?.writable) {
            return Promise.reject(new Error('Bridge is not ready'));
        }
        const id = String(++this.requestId);
        const request = JSON.stringify({ id, method, params }) + '\n';
        return new Promise((resolve, reject) => {
            const timeoutMs = timeoutOverrideMs ?? this.options.callTimeoutMs ?? CALL_TIMEOUT_MS;
            const timer = setTimeout(() => {
                this.pending.delete(id);
                reject(new Error(`Bridge call '${method}' timed out after ${timeoutMs}ms`));
            }, timeoutMs);
            this.pending.set(id, {
                resolve: resolve,
                reject,
                timer,
            });
            this.process.stdin.write(request, 'utf8', (err) => {
                if (err) {
                    this.pending.delete(id);
                    clearTimeout(timer);
                    reject(new Error(`Failed to write to bridge stdin: ${err.message}`));
                }
            });
        });
    }
    /**
     * Verify the child is alive and responding; respawn it if not.
     * Called between read-retry attempts and from the idle health-check.
     */
    async ensureHealthy() {
        if (this._disposed)
            throw new Error('BridgeClient disposed');
        if (this.processAlive()) {
            try {
                await this.callOnce('ping', {}, PING_TIMEOUT_MS);
                return;
            }
            catch {
                // alive but wedged — fall through to restart
            }
        }
        await this.restart();
    }
    processAlive() {
        return this._isReady && this.process !== null && this.process.exitCode === null;
    }
    /**
     * Tear down the current child and spawn a fresh one. Concurrent callers
     * share a single in-flight restart. Capped at maxRestarts per 60s to avoid
     * crash loops — past the cap the error tells the user where to look.
     */
    async restart() {
        if (this._disposed)
            throw new Error('BridgeClient disposed');
        if (this.restartPromise) {
            await this.restartPromise;
            return this.readyPayload;
        }
        const now = Date.now();
        const maxRestarts = this.options.maxRestarts ?? MAX_RESTARTS;
        this.restartTimestamps = this.restartTimestamps.filter(t => now - t < RESTART_WINDOW_MS);
        if (this.restartTimestamps.length >= maxRestarts) {
            throw new Error(`Bridge child restarted ${maxRestarts}x within ${RESTART_WINDOW_MS / 1000}s and keeps failing — giving up. ` +
                `Check the bridge log (D365FO_BRIDGE_LOG_FILE) for the underlying crash.`);
        }
        this.restartTimestamps.push(now);
        this.restartPromise = (async () => {
            console.error('[BridgeClient] Restarting bridge child process…');
            this.rejectAllPending(new Error('Bridge restarting'));
            // Awaited: respawning while the old child still holds the packages directory
            // is what a restart exists to get away from.
            await this.killChild();
            this._isReady = false;
            this.readyPayload = null;
            this.buffer = '';
            await this.spawnAndWaitReady();
            console.error('[BridgeClient] Bridge child restarted successfully');
        })();
        try {
            await this.restartPromise;
        }
        finally {
            this.restartPromise = null;
        }
        return this.readyPayload;
    }
    /** Periodic idle ping (BRIDGE_HEALTHCHECK_MS > 0) — proactively respawns a dead/wedged child. */
    startHealthcheck() {
        const intervalMs = this.options.healthcheckMs ?? HEALTHCHECK_MS;
        if (!intervalMs || this.healthTimer)
            return;
        this.healthTimer = setInterval(() => {
            if (this._disposed || this.restartPromise)
                return;
            // Skip when calls are in flight — they detect failures themselves.
            if (this.pending.size > 0)
                return;
            void this.ensureHealthy().catch((err) => {
                console.error(`[BridgeClient] Health-check failed: ${err instanceof Error ? err.message : err}`);
            });
        }, intervalMs);
        if (typeof this.healthTimer.unref === 'function')
            this.healthTimer.unref();
    }
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
    async dispose() {
        if (this._disposed)
            return;
        this._disposed = true;
        this._isReady = false;
        if (this.healthTimer) {
            clearInterval(this.healthTimer);
            this.healthTimer = null;
        }
        this.rejectAllPending(new Error('BridgeClient disposed'));
        await this.killChild();
    }
    /**
     * Kill the current child process (used by dispose and restart), escalating until
     * it is actually gone: end stdin so it can finish an in-flight AOT write, then
     * SIGTERM, then SIGKILL. Resolves when the child exits, or after the last step's
     * budget — shutdown must not be the thing that hangs.
     */
    async killChild() {
        // Capture the reference before clearing this.process so the exit listener below
        // (and any late event from the replaced child) cannot touch its successor.
        const child = this.process;
        this.process = null;
        if (!child)
            return;
        if (child.exitCode !== null || child.signalCode !== null)
            return;
        const exited = new Promise((resolve) => {
            child.once('exit', () => resolve());
        });
        try {
            child.stdin?.end();
        }
        catch { /* pipe already gone */ }
        if (await settledWithin(exited, KILL_GRACE_MS))
            return;
        console.error('[BridgeClient] Child did not exit on stdin close — sending SIGTERM');
        try {
            child.kill('SIGTERM');
        }
        catch { /* already gone */ }
        if (await settledWithin(exited, KILL_HARD_MS))
            return;
        console.error('[BridgeClient] Child survived SIGTERM — sending SIGKILL');
        try {
            child.kill('SIGKILL');
        }
        catch { /* already gone */ }
        if (!(await settledWithin(exited, KILL_HARD_MS))) {
            console.error(`[BridgeClient] Child pid=${child.pid} did not die after SIGKILL — abandoning it`);
        }
    }
    // ========================================
    // Typed convenience methods
    // ========================================
    async ping() {
        return this.call('ping');
    }
    async readTable(tableName) {
        return this.call('readTable', { tableName });
    }
    async readClass(className) {
        return this.call('readClass', { className });
    }
    async readEnum(enumName) {
        return this.call('readEnum', { enumName });
    }
    async readEdt(edtName) {
        return this.call('readEdt', { edtName });
    }
    async readForm(formName) {
        return this.call('readForm', { formName });
    }
    async readQuery(queryName) {
        return this.call('readQuery', { queryName });
    }
    async readView(viewName) {
        return this.call('readView', { viewName });
    }
    async readDataEntity(entityName) {
        return this.call('readDataEntity', { entityName });
    }
    async readReport(reportName) {
        return this.call('readReport', { reportName });
    }
    async getMethodSource(className, methodName) {
        return this.call('getMethodSource', { className, methodName });
    }
    async searchObjects(query, objectType, maxResults) {
        const params = { query };
        if (objectType)
            params.objectType = objectType;
        if (maxResults != null)
            params.maxResults = maxResults;
        return this.call('searchObjects', params);
    }
    async listObjects(type) {
        return this.call('listObjects', { type });
    }
    async findReferences(targetName, targetType) {
        const params = { targetName };
        if (targetType)
            params.targetType = targetType;
        return this.call('findReferences', params);
    }
    // Security, Menu Items, Table Extensions, Completion, Xref
    async readSecurityPrivilege(name) {
        return this.call('readSecurityPrivilege', { name });
    }
    async readSecurityDuty(name) {
        return this.call('readSecurityDuty', { name });
    }
    async readSecurityRole(name) {
        return this.call('readSecurityRole', { name });
    }
    async readMenuItem(name, itemType) {
        const params = { name };
        if (itemType)
            params.itemType = itemType;
        return this.call('readMenuItem', params);
    }
    async readTableExtensions(baseTableName) {
        return this.call('readTableExtensions', { baseTableName });
    }
    async getCompletionMembers(symbolName) {
        return this.call('getCompletionMembers', { symbolName });
    }
    async findExtensionClasses(baseClassName) {
        return this.call('findExtensionClasses', { baseClassName });
    }
    async findEventSubscribers(targetName, eventName, handlerType) {
        const params = { targetName };
        if (eventName)
            params.eventName = eventName;
        if (handlerType)
            params.handlerType = handlerType;
        return this.call('findEventSubscribers', params);
    }
    async findApiUsageCallers(apiName, limit) {
        const params = { apiName };
        if (limit)
            params.limit = limit;
        return this.call('findApiUsageCallers', params);
    }
    async getInfo() {
        return this.call('getInfo');
    }
    // Write-support methods
    /** Re-create the DiskProvider so newly written files are picked up. */
    async refreshProvider() {
        return this.call('refreshProvider');
    }
    /** Ask IMetadataProvider to read back an object — validates the XML is consumable. */
    async validateObject(objectType, objectName) {
        return this.call('validateObject', { objectType, objectName });
    }
    /** Check if an object exists in IMetadataProvider and return its model. */
    async resolveObjectInfo(objectType, objectName) {
        return this.call('resolveObjectInfo', { objectType, objectName });
    }
    // Write operations
    /** Create a D365FO object via IMetadataProvider.Create() */
    async createObject(params) {
        return this.call('createObject', params);
    }
    /**
     * Create a smart table via C# CreateSmartTable — all BP-smart defaults
     * (CacheLookup, FieldGroups, DeleteActions, TitleField, indexes) are auto-set in C#.
     */
    async createSmartTable(params) {
        return this.call('createSmartTable', params);
    }
    /** Add or replace a method on a class or table via IMetadataProvider.Update() */
    async addMethod(objectType, objectName, methodName, sourceCode) {
        return this.call('addMethod', { objectType, objectName, methodName, sourceCode });
    }
    /**
     * Add a field to a table, table-extension or data-entity-view-extension via
     * IMetadataProvider.Update(). dataField/dataSource select the data-entity mapped-field
     * path on the bridge side; fieldGroupName additionally appends it to a base-entity group.
     */
    async addField(objectName, fieldName, fieldType, edt, mandatory, label, dataField, dataSource, fieldGroupName) {
        return this.call('addField', { objectName, fieldName, fieldType, edt, mandatory, label, dataField, dataSource, fieldGroupName });
    }
    /** Set a property on any object via IMetadataProvider.Update() */
    async setProperty(objectType, objectName, propertyPath, propertyValue) {
        return this.call('setProperty', { objectType, objectName, propertyPath, propertyValue });
    }
    /** Replace code within a method via IMetadataProvider.Update() */
    async replaceCode(objectType, objectName, methodName, oldCode, newCode) {
        return this.call('replaceCode', { objectType, objectName, methodName, oldCode, newCode });
    }
    /** Remove a method from a class, table, form, query, or view */
    async removeMethod(objectType, objectName, methodName) {
        return this.call('removeMethod', { objectType, objectName, methodName });
    }
    /** Add an index to a table */
    async addIndex(tableName, indexName, fields, allowDuplicates, alternateKey) {
        return this.call('addIndex', { objectName: tableName, indexName, fields, allowDuplicates, alternateKey });
    }
    /** Remove an index from a table */
    async removeIndex(tableName, indexName) {
        return this.call('removeIndex', { objectName: tableName, indexName });
    }
    /** Add a full-text index to a table or table-extension (a separate collection from Indexes) */
    async addFullTextIndex(tableName, indexName, fields) {
        return this.call('addFullTextIndex', { objectName: tableName, indexName, fields });
    }
    /** Remove a full-text index from a table or table-extension */
    async removeFullTextIndex(tableName, indexName) {
        return this.call('removeFullTextIndex', { objectName: tableName, indexName });
    }
    /** Add a Map membership to a table or table-extension */
    async addTableMapping(tableName, mapName, mappingTable, connections) {
        return this.call('addTableMapping', { objectName: tableName, mapName, mappingTable, connections });
    }
    /** Remove a Map membership from a table or table-extension */
    async removeTableMapping(tableName, mapName) {
        return this.call('removeTableMapping', { objectName: tableName, mapName });
    }
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
    async addRelation(tableName, relationName, relatedTable, constraints, properties) {
        return this.call('addRelation', {
            objectName: tableName, relationName, relatedTable, constraints,
            relationCardinality: properties?.relationCardinality,
            relatedTableCardinality: properties?.relatedTableCardinality,
            relationshipType: properties?.relationshipType,
        });
    }
    /** Remove a relation from a table */
    async removeRelation(tableName, relationName) {
        return this.call('removeRelation', { objectName: tableName, relationName });
    }
    /** Add a field group to a table */
    async addFieldGroup(tableName, groupName, label, fields) {
        return this.call('addFieldGroup', { objectName: tableName, fieldGroupName: groupName, label, fields });
    }
    /** Remove a field group from a table */
    async removeFieldGroup(tableName, groupName) {
        return this.call('removeFieldGroup', { objectName: tableName, fieldGroupName: groupName });
    }
    /** Add a field reference to an existing field group */
    async addFieldToFieldGroup(tableName, groupName, fieldName, extendBaseFieldGroup) {
        return this.call('addFieldToFieldGroup', { objectName: tableName, fieldGroupName: groupName, fieldName, extendBaseFieldGroup });
    }
    /** Modify properties of an existing field on a table */
    async modifyField(tableName, fieldName, properties) {
        return this.call('modifyField', { objectName: tableName, fieldName, properties });
    }
    /** Rename a field on a table (also fixes index/fieldgroup/TitleField refs) */
    async renameField(tableName, oldName, newName) {
        return this.call('renameField', { objectName: tableName, fieldName: oldName, fieldNewName: newName });
    }
    /** Remove a field from a table */
    async removeField(tableName, fieldName) {
        return this.call('removeField', { objectName: tableName, fieldName });
    }
    /** Replace ALL fields on a table (clear + re-add) */
    async replaceAllFields(tableName, fields) {
        return this.call('replaceAllFields', { objectName: tableName, fields });
    }
    /** Add a value to an enum */
    async addEnumValue(enumName, valueName, value, label, countryRegionCodes) {
        return this.call('addEnumValue', { objectName: enumName, enumValueName: valueName, enumValue: value, label, countryRegionCodes });
    }
    /** Modify an existing enum value's properties */
    async modifyEnumValue(enumName, valueName, properties) {
        return this.call('modifyEnumValue', { objectName: enumName, enumValueName: valueName, properties });
    }
    /** Remove a value from an enum */
    async removeEnumValue(enumName, valueName) {
        return this.call('removeEnumValue', { objectName: enumName, enumValueName: valueName });
    }
    /** Add a control to a form */
    async addControl(formName, controlName, parentControl, controlType, dataSource, dataField, label) {
        return this.call('addControl', { objectName: formName, controlName, parentControl, controlType, controlDataSource: dataSource, controlDataField: dataField, label });
    }
    /** Add a data source to a form */
    async addDataSource(objectType, objectName, dsName, table, joinSource, linkType) {
        return this.call('addDataSource', { objectType, objectName, dataSourceName: dsName, dataSourceTable: table, joinSource, linkType });
    }
    /** Add/update a field modification in a table-extension (override base-table field label/mandatory) */
    async addFieldModification(extensionName, fieldName, fieldLabel, fieldMandatory) {
        return this.call('addFieldModification', { objectName: extensionName, fieldName, fieldLabel, fieldMandatory });
    }
    /** Add a menu item reference to a menu */
    async addMenuItemToMenu(menuName, menuItemToAdd, menuItemToAddType) {
        return this.call('addMenuItemToMenu', { objectName: menuName, menuItemToAdd, menuItemToAddType: menuItemToAddType ?? 'display' });
    }
    // Batch, Capabilities, Pattern Discovery
    /** Execute multiple write operations on a single object in one call */
    async batchModify(objectType, objectName, operations) {
        return this.call('batchModify', { objectType, objectName, operations });
    }
    /** Get structured capabilities map — lists available operations per object type */
    async getCapabilities() {
        return this.call('getCapabilities', {});
    }
    /** Discover available D365FO form patterns (runtime DLL or hardcoded fallback) */
    async discoverFormPatterns() {
        return this.call('discoverFormPatterns', {});
    }
    // Private helpers
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
    resolveBridgeExe() {
        const configured = this.options.bridgeExePath?.trim() || process.env.D365FO_BRIDGE_EXE_PATH?.trim();
        if (configured) {
            if (!fs.existsSync(configured)) {
                throw new Error(`Bridge exe not found at the configured path: ${configured}\n` +
                    '  Set bridge.exePath (D365FO_BRIDGE_EXE_PATH) to the built binary, or clear it to auto-detect.');
            }
            return configured;
        }
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const candidates = [
            // Development: built in-tree
            path.resolve(__dirname, '../../bridge/D365MetadataBridge/bin/Release', BRIDGE_EXE_NAME),
            // Production: alongside the server
            path.resolve(__dirname, './', BRIDGE_EXE_NAME),
            path.resolve(__dirname, BRIDGE_EXE_NAME),
        ];
        for (const candidate of candidates) {
            if (fs.existsSync(candidate)) {
                return candidate;
            }
        }
        throw new Error(`Bridge executable not found. Searched:\n${candidates.map(c => `  - ${c}`).join('\n')}\n` +
            `Build it with: cd bridge/D365MetadataBridge && dotnet build -c Release`);
    }
    rejectAllPending(error) {
        for (const [_id, pending] of this.pending) {
            clearTimeout(pending.timer);
            pending.reject(error);
        }
        this.pending.clear();
    }
}
// Factory function — detects D365FO presence
/**
 * Attempt to create and initialize a BridgeClient.
 * Returns null if D365FO is not installed or the bridge exe is missing.
 *
 * This is a non-throwing factory — safe to call during server startup.
 */
export async function createBridgeClient(options) {
    const packagesPath = options.packagesPath ?? detectPackagesPath();
    if (!packagesPath) {
        console.error('[BridgeClient] No packagesPath detected — bridge disabled.\n' +
            '  Set "packagePath" in .mcp.json context, or "D365FO_PACKAGE_PATH" env var.\n' +
            '  Checked: options.packagesPath=' + (options.packagesPath ?? 'undefined') +
            ', D365FO_PACKAGE_PATH=' + (process.env.D365FO_PACKAGE_PATH ?? 'undefined') +
            ', PACKAGES_PATH=' + (process.env.PACKAGES_PATH ?? 'undefined'));
        return null;
    }
    console.error(`[BridgeClient] packagesPath=${packagesPath}, binPath=${options.binPath ?? 'auto'}`);
    const client = new BridgeClient({
        ...options,
        packagesPath,
    });
    try {
        await client.initialize();
        return client;
    }
    catch (err) {
        console.error(`[BridgeClient] Initialization failed: ${err}`);
        await client.dispose();
        return null;
    }
}
function detectPackagesPath() {
    // Canonical env vars take priority over well-known path probes. D365FO_PACKAGE_PATH can be set
    // in .env (traditional mode, loaded by dotenv at startup) or in the .mcp.json env{} block
    // (VS passes it to the subprocess). Both sources land in process.env equivalently.
    // PACKAGES_PATH is the legacy .env.example name.
    const candidates = [
        process.env.D365FO_PACKAGE_PATH ?? '',
        process.env.PACKAGES_PATH ?? '',
        // Whatever AosService volumes this machine actually has (C:, J:, K:, …)
        ...packagesRoots(),
    ].filter(Boolean);
    for (const p of candidates) {
        // Traditional: bin is directly under packagesPath
        if (fs.existsSync(path.join(p, 'bin', 'Microsoft.Dynamics.AX.Metadata.dll'))) {
            return p;
        }
    }
    return null;
}
//# sourceMappingURL=bridgeClient.js.map