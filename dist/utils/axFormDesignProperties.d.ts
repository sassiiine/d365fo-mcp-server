/**
 * AxForm <Design> property upsert.
 *
 * The C# bridge rejects modify-property for forms outright ("modify-property not
 * supported for objectType form via bridge"), so the Design annotations
 * object_patterns(action="spec") prescribes — Pattern / PatternVersion / Style —
 * could not be set through any grounded path (findings #37, corpus
 * 2026-07-22T04__L2-form-over-view). The generic directXmlModifyProperty cannot
 * serve them either: Caption/Style also occur on controls, so it sees several
 * matches and refuses to guess.
 *
 * Ground truth for shape and order: eval/goldens/L1-form-listpage (VM-captured,
 * built clean) — Design's direct-child properties carry `xmlns=""`, are
 * alphabetical, and <Controls> terminates the block.
 */
/**
 * Set a form Design property, inserting it in alphabetical order when absent.
 * Returns the updated XML, or null when the document is not an AxForm, has no
 * <Design>, or the property is not a Design property (so the caller can surface
 * the original error rather than write something invented).
 */
export declare function upsertAxFormDesignProperty(xml: string, property: string, value: string): string | null;
//# sourceMappingURL=axFormDesignProperties.d.ts.map