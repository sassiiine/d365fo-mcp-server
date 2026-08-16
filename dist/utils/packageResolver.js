/**
 * Package Resolver
 * Maps model names to package names using descriptor XML files
 * and filesystem scanning.
 *
 * In D365FO, the metadata directory structure is:
 *   {Root}/{PackageName}/{ModelName}/AxClass/...
 *   {Root}/{PackageName}/Descriptor/{ModelName}.xml
 *
 * The descriptor XML contains <ModelModule> (package name) and <Name> (model name).
 * A single package (e.g., "CustomExtensions") can contain many models
 * (e.g., "Contoso Utilities", "Contoso Reporting").
 *
 * This resolver builds a map from model name -> package info by:
 * 1. Reading descriptor XML files (primary strategy)
 * 2. Falling back to filesystem scanning for directories with AOT-type folders
 */
import * as fs from 'fs/promises';
import { realpathSync } from 'fs';
import * as path from 'path';
/**
 * Resolve the actual on-disk casing of a path (Windows is case-insensitive but
 * VS Code and Copilot compare paths case-sensitively). Falls back to the
 * original string if the path does not exist yet.
 */
function normalizePathCase(p) {
    try {
        return realpathSync(p);
    }
    catch {
        return p;
    }
}
export class PackageResolver {
    roots;
    modelToPackageMap = null;
    /** Lowercase lookup mirror of modelToPackageMap for case-insensitive resolve(). */
    lowercaseLookup = null;
    buildPromise = null;
    constructor(roots) {
        this.roots = roots.filter(Boolean);
    }
    /**
     * Resolve a model name to its package name.
     * Returns null if the model cannot be found in any root.
     */
    async resolve(modelName) {
        await this.ensureBuilt();
        return this.modelToPackageMap.get(modelName) ||
            this.lowercaseLookup.get(modelName.toLowerCase()) ||
            null;
    }
    /**
     * Resolve with an explicit package name (bypasses lookup).
     */
    resolveWithPackage(modelName, packageName) {
        return {
            packageName,
            modelName,
            rootPath: this.roots[0] || '',
        };
    }
    /**
     * Get all known model-to-package mappings.
     */
    async getAllMappings() {
        await this.ensureBuilt();
        return new Map(this.modelToPackageMap);
    }
    /**
     * Invalidate the cache to force a rescan.
     */
    clearCache() {
        this.modelToPackageMap = null;
        this.lowercaseLookup = null;
        this.buildPromise = null;
    }
    async ensureBuilt() {
        if (this.modelToPackageMap)
            return;
        if (!this.buildPromise) {
            this.buildPromise = this.buildMap().catch((err) => {
                this.buildPromise = null;
                throw err;
            });
        }
        await this.buildPromise;
    }
    async buildMap() {
        const map = new Map();
        const lcMap = new Map();
        for (const rawRoot of this.roots) {
            if (!rawRoot)
                continue;
            const root = normalizePathCase(rawRoot);
            let packageDirs;
            try {
                const entries = await fs.readdir(root, { withFileTypes: true });
                packageDirs = entries
                    .filter(e => e.isDirectory() || e.isSymbolicLink())
                    .map(e => e.name);
            }
            catch {
                continue;
            }
            for (const pkgName of packageDirs) {
                const pkgPath = path.join(root, pkgName);
                // Strategy 1: descriptor XML files
                const descriptorDir = path.join(pkgPath, 'Descriptor');
                try {
                    const descriptorFiles = await fs.readdir(descriptorDir);
                    for (const file of descriptorFiles) {
                        if (!file.endsWith('.xml'))
                            continue;
                        const filePath = path.join(descriptorDir, file);
                        try {
                            const content = await fs.readFile(filePath, 'utf-8');
                            const nameMatch = content.match(/<Name>([^<]+)<\/Name>/);
                            const moduleMatch = content.match(/<ModelModule>([^<]+)<\/ModelModule>/);
                            const modelName = nameMatch?.[1]?.trim();
                            const packageName = moduleMatch?.[1]?.trim() || pkgName;
                            if (modelName && !map.has(modelName)) {
                                const resolved = { packageName, modelName, rootPath: root };
                                map.set(modelName, resolved);
                                lcMap.set(modelName.toLowerCase(), resolved);
                            }
                        }
                        catch {
                            // Skip unreadable descriptor
                        }
                    }
                }
                catch {
                    // No Descriptor directory -- fall through to filesystem scan
                }
                // Strategy 2: filesystem scan (subdirs containing an AOT-type folder)
                try {
                    const subEntries = await fs.readdir(pkgPath, { withFileTypes: true });
                    const subDirs = subEntries
                        .filter(e => e.isDirectory() || e.isSymbolicLink())
                        .map(e => e.name)
                        .filter(n => n !== 'Descriptor' && n !== 'bin' && !n.startsWith('.'));
                    for (const subDir of subDirs) {
                        const modelPath = path.join(pkgPath, subDir);
                        const hasAotFolder = await this.hasAotTypeFolder(modelPath);
                        if (hasAotFolder && !map.has(subDir)) {
                            const resolved = { packageName: pkgName, modelName: subDir, rootPath: root };
                            map.set(subDir, resolved);
                            lcMap.set(subDir.toLowerCase(), resolved);
                        }
                    }
                }
                catch {
                    // Skip unreadable package directory
                }
            }
        }
        this.modelToPackageMap = map;
        this.lowercaseLookup = lcMap;
    }
    static AOT_FOLDERS = new Set([
        'axclass', 'axtable', 'axenum', 'axform', 'axedt', 'axview', 'axdataentityview',
    ]);
    async hasAotTypeFolder(dirPath) {
        try {
            const entries = await fs.readdir(dirPath);
            return entries.some(e => PackageResolver.AOT_FOLDERS.has(e.toLowerCase()));
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=packageResolver.js.map