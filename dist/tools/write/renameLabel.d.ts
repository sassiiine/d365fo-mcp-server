/**
 * Rename Label Tool
 *
 * Renames a label ID across ALL places where it appears:
 *  1. Every .label.txt file in the model (the label entry itself)
 *  2. Every X++ source file (.xpp) referencing @LabelFileId:OldId
 *  3. Every XML metadata file referencing @LabelFileId:OldId in properties
 *     such as <Label>, <HelpText>, <Caption>, <Description>, <Tooltip>, etc.
 *  4. Updates the MCP SQLite label index
 *
 * The search covers only the model's own package directory by default, but can be
 * extended to additional directories via the `searchPaths` parameter.
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
export declare function renameLabelTool(request: CallToolRequest, context: XppServerContext): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    isError?: undefined;
    content: {
        type: string;
        text: string;
    }[];
}>;
//# sourceMappingURL=renameLabel.d.ts.map