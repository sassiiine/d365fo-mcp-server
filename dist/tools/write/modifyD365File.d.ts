/**
 * Modify D365FO File Tool
 * Edit existing D365FO XML files (AxClass, AxTable, AxForm, etc.)
 * Supports atomic operations: add method, add field, modify property
 */
import type { CallToolRequest } from '@modelcontextprotocol/sdk/types.js';
import type { XppServerContext } from '../../types/context.js';
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
 * Why the bridge path did not apply, in the caller's own words.
 *
 * The direct-XML fallbacks used to announce "bridge was unavailable" unconditionally,
 * which is the true reason in only one of the four ways the bridge path can decline:
 * it can also be a type outside BRIDGE_MODIFY_TYPES, an SDK that cannot reach the
 * member (form control overrides), or a thrown error. Reporting the wrong cause sent
 * agents off to restart a bridge that was healthy — and hid genuine outages behind a
 * green result, since the write still succeeded (see the #4 sweep finding: two calls
 * "fell back" while a third seconds later went through Update just fine).
 */
export declare function describeBridgeFallbackReason(bridge: {
    isReady?: boolean;
    metadataAvailable?: boolean;
} | undefined, objectType: string, operation: string, bridgeResult: {
    success: boolean;
    message: string;
} | null): string;
/**
 * Refuse a replace-code that cannot mean what the caller intends.
 *
 * The bridge edits with .NET `String.Replace` (MetadataWriteService.ReplaceIn
 * Methods) — replace-ALL, no count, no echo. Two failure modes are decidable
 * from the file first: oldCode matching more than once, and an edit whose
 * newCode is already present and contains oldCode (oldCode="checkFailed",
 * newCode="this.checkFailed" over `this.checkFailed` yields
 * `this.this.checkFailed`).
 *
 * Returns null to proceed, `noop` when the file is already in the requested
 * state, `refuse` when the call is ambiguous.
 */
export interface ReplaceCodeVerdict {
    kind: 'noop' | 'refuse';
    message: string;
}
export declare function preflightReplaceCode(content: string, oldCode: string, newCode: string): ReplaceCodeVerdict | null;
/**
 * The lines a write changed, with context, so seeing the result costs no
 * read_file round trip.
 */
export declare function renderChangedLines(before: string, after: string, context?: number): string;
/**
 * Normalises a NoYes-shaped flag to a boolean.
 *
 * The wire type is boolean, but the value these params end up as in AxTable XML
 * is `No`/`Yes`, so callers legitimately pass the string spelling (corpus #27:
 * indexAllowDuplicates="No" was rejected with a bare "expected boolean").
 * Anything unrecognised returns undefined so the op's own default applies.
 */
export declare function coerceNoYesFlag(value: unknown): boolean | undefined;
/**
 * Locates ONE top-level collection element inside a root element's body, e.g.
 * `<Fields>` directly under `<AxDataEntityViewExtension>`.
 *
 * A plain `content.replace('</Fields>', …)` is wrong here and silently so: an
 * AxDataEntityViewExtension carries `<FieldGroupExtensions>` BEFORE `<Fields>`, and
 * each `<AxTableFieldGroupExtension>` inside it has a nested `<Fields>` of its own.
 * The first `</Fields>` in the file therefore closes the field GROUP, and the new
 * element lands in a collection the deserializer will not read it from.
 *
 * Depth-counts from the root's opening tag so only a DIRECT child matches.
 * Returns the insertion offset (just before the collection's closing tag), or a
 * `selfClosingAt` range when the collection is `<Fields />` and must be expanded.
 */
export declare function findTopLevelCollection(content: string, rootElement: string, collection: string): {
    insertAt: number;
} | {
    selfClosingAt: [number, number];
} | null;
/** DeleteAction values accepted by the AxTable serialiser. */
export declare const DELETE_ACTION_TYPES: readonly ['None', 'Restricted', 'Cascade', 'CascadeRestricted'];
/**
 * Writes the relation properties the bridge drops into an <AxTableRelation>.
 *
 * add-relation documents relationCardinality / relatedTableCardinality /
 * relationshipType WITH defaults, but neither bridgeClient.addRelation nor the
 * C# MetadataWriteService.AddRelation carries them: AddRelation only sets Name,
 * RelatedTable and the constraints. The result was a relation that reports
 * "✅ Relation 'X' added" and then fails BP with
 * BPErrorTableRelationshipPropertiesCompleteness naming exactly those three
 * properties — with no repair path, because modify-property rejects
 * Relations/<name>/RelationshipType (corpus findings #5 / #35).
 *
 * The C# side cannot be fixed or tested without the VM's metadata assemblies, so
 * the properties are written on disk after the relation lands. Element order is
 * the one both in-repo generators emit (createD365File.ts / generateTableRelation.ts,
 * matching the SDK serialiser): Name, Cardinality, RelatedTable,
 * RelatedTableCardinality, RelationshipType, Constraints. Order matters — AxTable
 * XML silently drops misordered properties (#13) — so nothing is guessed here:
 * each element is anchored to the sibling it must follow, and the function is a
 * no-op if the anchor is absent or the property is already present.
 */
export declare const directXmlEnsureRelationProperties: (filePath: string, relationName: string, cardinality: string, relatedTableCardinality: string, relationshipType: string) => Promise<{
    applied: string[];
} | null>;
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
    isError?: undefined;
    content: {
        type: string;
        text: string;
    }[];
}>;
/**
 * Prefix the new member name this operation carries, when writing into an
 * extension. Mutates `args` in place and returns a note for the response (empty
 * when nothing changed), so the agent learns the real name and addresses the
 * member correctly in its next call.
 *
 * Idempotent: a name that already carries the prefix — in either the underscore
 * or the bare form, case-insensitively — is left untouched, so an agent that
 * prefixes by hand does not end up with DEMO_DEMO_Foo.
 */
export declare function applyExtensionMemberPrefix(args: Record<string, any>, objectType: string, operation: string, modelName: string): string;
/**
 * Point `add-field-to-field-group` at the field that actually exists.
 *
 * add-field on an extension renames what it adds — `QualityTier` becomes
 * `CtsoSK_QualityTier`, because a member added to someone else's table has to
 * carry your prefix — and says so in the response. The group entry that follows
 * it names the SAME field, and it was left exactly as the caller spelled it:
 * applyExtensionMemberPrefix mints names for new members and this operation
 * mints none, so it is correctly absent from EXTENSION_MEMBER_NAME_ARG.
 *
 * The result was a dangling reference. The bridge validates no DataField, so
 * `<DataField>QualityTier</DataField>` was written against a field named
 * `CtsoSK_QualityTier`, reported as applied, and the group silently pointed at
 * nothing. Sending both operations in ONE call — which every add-field response
 * tells the agent to do — hit it every time.
 *
 * Blind prefixing is the wrong repair: a group extension may perfectly well
 * carry a BASE-table field, which has no prefix. So this corrects only the case
 * with one reading — the name as given is not a field of the extension, the
 * prefixed name is, and the base table has no field by the given name either.
 * Anything else is left untouched.
 *
 * Advisory, like every other auto-correction: it runs before a write that is
 * perfectly capable of succeeding without it, so anything unreadable — the
 * extension file, the base table, the prefix rules — means "no correction", not
 * a failed modify.
 */
export declare function resolveFieldNameForFieldGroup(args: Record<string, any>, objectType: string, operation: string, modelName: string, actualFilePath: string, symbolIndex: any): Promise<string>;
/**
 * Create file backup and verify it was written successfully.
 * Throws if the source file is missing or the copy fails, so callers
 * always know whether a valid backup exists before overwriting.
 * Returns the backup file path.
 *
 * The name carries MILLISECONDS and, if that still collides, a counter. At the old
 * one-second resolution two modifies of the same file inside the same second
 * produced the same backup name, so the second copy overwrote the first with
 * already-modified content — on a target outside git (exactly the case that forces
 * a backup, see ensureRecoverableModification) the original was then unrecoverable.
 * COPYFILE_EXCL is what makes the retry a claim rather than a check: it fails
 * instead of overwriting, so two callers racing on the same name cannot both win.
 *
 * Exported for unit tests.
 */
export declare function createFileBackup(filePath: string): Promise<string>;
/**
 * Backup guard for modify operations. Honors an explicit createBackup=true;
 * with createBackup=false it force-enables the backup when the target is not
 * inside a git work tree, because the documented undo path
 * (undo_last_modification → git checkout) only works inside a repo.
 * Returns a note to append to the success response ('' when no forced backup
 * was needed). Exported for unit tests.
 */
export declare function ensureRecoverableModification(actualFilePath: string, createBackup: boolean): Promise<string>;
/**
 * Locate the base form XML on disk, trying DB path → remapped path → filesystem scan.
 * Returns raw XML content, or null if not accessible.
 */
export declare function findBaseFormXml(baseFormName: string, symbolIndex: any): Promise<string | null>;
/**
 * Locate the XML of a base (non-extension) object on disk, trying DB path →
 * remapped path → filesystem scan. `objectType` is both the symbols-table type
 * and the findD365FileOnDisk key ('form', 'table', …).
 * Returns raw XML content, or null if not accessible.
 */
export declare function findBaseObjectXml(objectType: string, objectName: string, symbolIndex: any): Promise<string | null>;
/**
 * Note for a successful add-field-to-field-group: is this field group already
 * rendered on a form through a container's <DataGroup>?
 *
 * If it is, the compiler puts the new field on that form by itself and any
 * hand-added control for it collides with the generated one. The add-control
 * guard says the same thing, but only once a form extension exists and a control
 * is being added to it — a create that then has to be undone. Said here it costs
 * one indexed lookup.
 *
 * Returns '' on any miss — no form on the table, no container with that
 * DataGroup, an unreadable form, a database that cannot answer — which leaves
 * the reactive guard exactly as it was.
 */
export declare function describeFieldGroupRendering(baseTableName: string, groupName: string, fieldName: string, symbolIndex: any): Promise<string>;
/**
 * The other half of {@link describeFieldGroupRendering}: the field group reaches
 * no form, and these are the groups on this table that do.
 *
 * A field group a form does not name in `<DataGroup>` generates no controls, so a
 * field parked in a brand-new group on a table extension is on no form at all.
 * Nothing said so, and the two paths look identical from the outside: put the
 * field in a rendered base group and it appears for free, or invent a group and
 * then need a form extension, an add-control, the duplicate-name guard and an
 * undo. Run 81803f01 spent ~24 AIU discovering the difference.
 *
 * Returns '' whenever the answer would be a guess — no form on the table, no
 * `<DataGroup>` anywhere, an unreadable form, an index that cannot answer — and
 * also when the group IS rendered, which is the sibling's sentence to say.
 */
export declare function describeUnrenderedFieldGroup(baseTableName: string, groupName: string, symbolIndex: any): Promise<string>;
/**
 * The form control type to bind to a table field: ComboBox for an enum, the
 * EDT's base type otherwise.
 *
 * This used to be `heuristicEdtBaseType(fieldName)` — a guess from the field's
 * NAME, with a comment saying an index lookup was out of scope because it would
 * mean resolving the data source back to its table. It costs one query:
 * resolveFieldEdt() already answers "what type is field F of table T", and a
 * form data source is conventionally named after its table, which is the case
 * the fallbacks below cover when it is not.
 *
 * The gap it left was enums. A name heuristic has nothing to match on, so an
 * enum field got the String default and became an AxFormStringControl — a text
 * box over an enum. Recovering from that took an undo, a re-create and a
 * re-modify, because a control's type cannot be changed in place.
 */
export declare function resolveControlTypeForField(dataSource: string | undefined, dataField: string | undefined, db: any): string | undefined;
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