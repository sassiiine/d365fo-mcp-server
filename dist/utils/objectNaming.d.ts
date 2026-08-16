/**
 * The on-disk name an object type + caller-supplied name resolves to.
 *
 * This lived inside create_d365fo_file as ninety lines of inline cases, which
 * meant `create` and `modify` disagreed about what an object is called.
 * `create` turns `{objectType: "table-extension", objectName: "PurchTable"}`
 * into `PurchTable.CtsoExtension` and writes that file; `modify` given the same
 * two arguments looked for a file literally named `PurchTable`, missed, and
 * answered "File not found for table-extension" — one call after `create` had
 * printed the path. The caller then had to pass `filePath` by hand, three times
 * in the session that surfaced this.
 *
 * Same inputs, same name, one implementation.
 */
/**
 * Extension types whose AOT name is `Base.{Token}Extension`. A bare base name
 * for one of these has to grow the dot before prefixing, or applyObjectPrefix
 * reads it as a brand-new object and produces `CtsoPurchTable`.
 */
export declare const DOT_NOTATION_EXTENSION_TYPES: ReadonlySet<string>;
export declare function isExtensionObjectType(objectType: string): boolean;
/**
 * Normalise `objectName` for `objectType` under the active naming style.
 *
 * Idempotent: an already-normalised name comes back unchanged, so callers may
 * apply it without checking whether someone else already did.
 *
 * `onNote` receives a line per transformation, for callers that log them.
 */
export declare function normalizeObjectName(objectName: string, objectType: string, modelName: string | undefined, onNote?: (note: string) => void): string;
//# sourceMappingURL=objectNaming.d.ts.map