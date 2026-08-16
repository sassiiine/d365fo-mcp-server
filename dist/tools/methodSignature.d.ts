/**
 * Get Method Signature Tool
 * Extract exact method signature for Chain of Command (CoC) extensions
 * Returns method modifiers, return type, parameters with types
 *
 * PRIMARY: C# bridge (IMetadataProvider) via tryBridgeMethodSignature.
 * SQLite is used only as a gate (verify class/method exists).
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
export declare function getMethodSignatureTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
//# sourceMappingURL=methodSignature.d.ts.map