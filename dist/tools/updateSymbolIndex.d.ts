import type { XppServerContext } from '../types/context.js';
export declare const updateSymbolIndexTool: (params: any, context: XppServerContext) => Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
}>;
//# sourceMappingURL=updateSymbolIndex.d.ts.map