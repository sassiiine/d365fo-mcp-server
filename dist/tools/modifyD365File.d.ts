/**
 * Modify D365FO File Tool
 * Edit existing D365FO XML files (AxClass, AxTable, AxForm, etc.)
 * Supports atomic operations: add method, add field, modify property
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../types/context.js';
/**
 * Decode XML entities from X++ source code.
 *
 * X++ source should never contain entity-encoded characters — `/// <summary>`
 * doc comments, generic types like `List<str>`, and comparison operators like
 * `x < y` all use literal `<` and `>`.  When an AI model copies code from an
 * SSRS report's entity-encoded <Text> block and passes it as `methodCode`, the
 * entities would otherwise survive into the CDATA section and corrupt the source.
 *
 * This function decodes the 5 standard XML entities so that source code always
 * contains proper characters before it is stored in the XML object.
 */
export declare function decodeXmlEntitiesFromXppSource(source: string): string;
/**
 * Reject an X++ source payload that smuggles XML/CDATA structure.
 *
 * Method source written through the bridge is handed verbatim to the D365FO SDK
 * serializer, which wraps it in `<![CDATA[ … ]]>` and emits the surrounding
 * `<Method>…</Method>` markup itself. If the caller's source already contains
 * the CDATA terminator `]]>` or closing metadata tags, the serializer writes
 * them inside the CDATA block unchanged — producing structurally invalid XML:
 * a premature/doubled `]]>` and a stray `<Method>` that drops the enclosing
 * `</Method>` (exactly the corruption D365FO refuses to deserialize). The
 * direct-XML replace fallback has the same exposure: a literal string replace
 * that injects `]]>` into an existing CDATA block corrupts it too.
 *
 * This always means the AI passed a slice of the .xml file where clean X++ was
 * expected. Reject it here — before it reaches disk — with an actionable
 * message, rather than silently escaping and hiding the mistake.
 *
 * X++ legitimately uses `<`/`>` (generics, comparisons, doc comments), so we
 * only flag the CDATA terminator and the specific opening/closing metadata
 * tokens, never bare angle brackets.
 */
export declare function assertCleanXppSource(source: string | undefined, paramName: string): void;
/** Count top-level X++ method bodies: a `{` opened at brace-depth 0 immediately
 *  after a `)` (a method signature). Nested blocks (if/for/switch) are inside the
 *  body (depth > 0) and a class wrapper opens after an identifier, so neither is
 *  miscounted. */
export declare function countTopLevelMethodBodies(source: string): number;
/** Split a source string containing one or more top-level X++ methods into the
 *  individual method sources (each including any leading doc comments / attributes
 *  and its full body). Mirrors countTopLevelMethodBodies' brace/comment/string
 *  handling. Used to let add-method accept several methods in one call and add them
 *  one <Method> at a time. */
export declare function splitTopLevelMethodBodies(source: string): string[];
/**
 * Reject an add-method payload that contains more than one method. Each add-method
 * call emits a single <Method>; passing two methods drops the second outside the
 * class scope and yields invalid X++ ("Unexpected token 'public' specified outside
 * the scope of any class or model element"). Splitting into separate calls is the fix.
 */
export declare function assertSingleMethodSource(source: string | undefined): void;
/**
 * Derive the method name from a full X++ method source: the identifier immediately
 * before the first '(' of the signature, after stripping comments, strings and
 * attribute blocks (e.g. [ExtensionOf(...)]). Lets add-method callers omit methodName
 * when they already pass the complete source (e.g. "public static X find(...)").
 * Returns null when no signature can be found.
 */
export declare function extractMethodNameFromSource(source: string | undefined): string | null;
/**
 * Heuristic: does a bridge failure message indicate the C# provider could not
 * resolve the target object (vs. a genuine operation error like "index already
 * exists")? An unresolved object is the one failure worth a refresh+retry,
 * because an object created this session may not be in the provider's
 * startup-fixed metadata roots yet.
 */
export declare function isUnresolvedObjectError(message: string | undefined): boolean;
export declare function modifyD365FileTool(request: CallToolRequest, context: XppServerContext): Promise<{
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
/**
 * Filesystem fallback for findD365File.
 * Constructs the expected AOT file path from config/env and checks if it exists on disk.
 * This handles objects that were just created and are not yet indexed in the symbol database.
 */
export declare function findD365FileOnDisk(objectType: string, objectName: string, modelName?: string, explicitPackagePath?: string): Promise<string | null>;
/**
 * Locate the base form XML on disk, trying DB path → remapped path → filesystem scan.
 * Returns raw XML content, or null if not accessible.
 */
export declare function findBaseFormXml(baseFormName: string, symbolIndex: any): Promise<string | null>;
/**
 * Generate idiomatic X++ source for a standard table method from a high-level
 * `tableMethodType`. The method name is implied by the type (find/exist/…), so
 * callers need not pass methodName or sourceCode — only tableMethodType (plus
 * tableKeyField for find/exist).
 *
 * Returns the generated method name, source, and an optional advisory note
 * (e.g. when the key field's EDT could not be resolved from the index).
 */
export declare function generateTableMethodSource(tableName: string, methodType: 'find' | 'exist' | 'findByRecId' | 'validateWrite' | 'validateDelete' | 'initValue', keyField: string | undefined, db: any): {
    methodName: string;
    source: string;
    note?: string;
};
/**
 * Generate an X++ display method stub returning the given EDT/type.
 * Used when add-display-method is called with displayMethodReturnEdt but no
 * explicit sourceCode/methodCode.
 */
export declare function generateDisplayMethodSource(methodName: string, returnEdt: string): string;
//# sourceMappingURL=modifyD365File.d.ts.map