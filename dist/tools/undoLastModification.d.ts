import type { XppServerContext } from '../types/context.js';
export declare const undoLastModificationTool: (params: any, context: XppServerContext) => Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
}>;
//# sourceMappingURL=undoLastModification.d.ts.map