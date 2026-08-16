/**
 * Get Method Signature Tool
 * Extract exact method signature for Chain of Command (CoC) extensions
 * Returns method modifiers, return type, parameters with types
 *
 * PRIMARY: C# bridge (IMetadataProvider) via tryBridgeMethodSignature.
 * SQLite is used only as a gate (verify class/method exists).
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
interface MethodSignature {
    modifiers: string[];
    returnType: string;
    methodName: string;
    parameters: Array<{
        type: string;
        name: string;
        defaultValue?: string;
    }>;
    signature: string;
    cocTemplate: string;
}
export declare function getMethodSignatureTool(request: CallToolRequest, context: XppServerContext): Promise<any>;
/**
 * Parse method signature from source code.
 *
 * The declaration parsing itself lives in ../metadata/xppDeclaration.js and is
 * shared with the XML metadata parser; this only turns a parsed declaration
 * into the rendered signature and CoC template. Exported for unit tests.
 */
export declare function parseMethodSignature(source: string, methodName: string): MethodSignature | null;
export {};
//# sourceMappingURL=methodSignature.d.ts.map