/**
 * MCP Resource helpers: X++ Class Source Code.
 * Exposes class source via xpp://class/{className} URIs. Pure helpers
 * consumed by the unified resource registrar (resources/index.ts), which
 * owns the actual request handlers.
 */
import type { XppServerContext } from '../types/context.js';
export declare const CLASS_URI_PREFIX = "xpp://class/";
/** True when a URI addresses a class source resource. */
export declare function isClassUri(uri: string): boolean;
/**
 * Read the full X++ source for a class addressed by an xpp://class/{name} URI.
 * Returns the reconstructed source (declaration + methods).
 * Throws when the class is unknown or cannot be parsed.
 */
export declare function readClassSource(context: XppServerContext, uri: string): Promise<string>;
//# sourceMappingURL=classResource.d.ts.map