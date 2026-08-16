/**
 * `labels` write-plumbing parameter specs — fetched on demand instead of being
 * inlined in the wire schema.
 *
 * Same trade as issue #825 made for d365fo_file and generate_object: `labels`
 * was the single largest tool in the ListTools payload (6,197 of 53,450 chars,
 * against a 6,200 per-tool cap), and most of that was create/rename plumbing —
 * packageName, packagePath, projectPath, solutionPath, addToProject,
 * createLabelFileIfMissing, sortLabels, languages, searchPaths, updateIndex,
 * allowExtensionLabelFile, defaultComment, description. Every one of them is
 * auto-resolved in the normal path, so the overwhelmingly common call never
 * names any of them — yet all thirteen were re-sent on every single request.
 *
 * They remain fully accepted: the handler merges `{...args, ...args.params}`,
 * so both the flat and the nested spelling work. Reachable as
 * get_knowledge(kind="op-spec", topic="labels").
 *
 * tests/tools/labelsOpSpecs.test.ts guards that the schema and this file do not
 * drift apart — a parameter must be in exactly one of them.
 */
/** Parameter name → its contract. Everything here is accepted but unpublished:
 *  the thirteen above left the wire schema, and createIfMissing was added here
 *  rather than to it (the payload had 124 chars of headroom). */
export declare const LABELS_OVERRIDE_PARAMS: Record<string, string>;
/** The contract rendered for get_knowledge(kind="op-spec", topic="labels"). */
export declare function renderLabelsOpSpec(): string;
//# sourceMappingURL=labelsOpSpecs.d.ts.map