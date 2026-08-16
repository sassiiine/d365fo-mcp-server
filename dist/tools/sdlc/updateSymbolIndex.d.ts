import type { XppServerContext } from '../../types/context.js';
import type { XppSymbol } from '../../metadata/types.js';
/** True for an AOT element folder segment — mapped types plus everything else Ax*. */
export declare function isAotFolder(segment: string): boolean;
/**
 * Symbol type for an AOT folder segment.
 *
 * #34: the old expression was `AOT_FOLDER_TYPE_MAP[folder] ?? 'class'`, which
 * turned every unmapped AOT folder into a CLASS — an AxMenu was indexed as
 * `type=class`, poisoning search and every type-scoped lookup. A folder we can
 * name but not map now yields its own derived type (`AxWorkflowType` →
 * `workflowtype`) instead of a confident lie; `class` remains the fallback only
 * when the path carries no AOT folder at all.
 */
export declare function classifyAotFolder(aotFolder: string): XppSymbol['type'];
export declare const updateSymbolIndexTool: (params: any, context: XppServerContext) => Promise<{
    content: {
        type: string;
        text: string;
    }[];
}>;
export declare function indexOneFile(filePath: string, context: XppServerContext): Promise<{
    text: string;
    isError: boolean;
}>;
//# sourceMappingURL=updateSymbolIndex.d.ts.map