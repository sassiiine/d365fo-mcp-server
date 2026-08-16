/**
 * EXTENSION_PREFIX canonicalisation for the eval golden oracle.
 *
 * Split out of normalize.ts so the artifact-key layer (artifactKey.ts) can use
 * it without an import cycle back through the normalizer.
 */
/** Stable placeholder a canonicalised prefix occurrence is replaced with. */
export declare const PREFIX_PLACEHOLDER = "PFX";
/** One or more EXTENSION_PREFIX tokens to canonicalise a document against. */
export type PrefixSpec = string | readonly string[];
/**
 * Canonicalise occurrences of `prefix` — the model-naming EXTENSION_PREFIX in
 * effect for THIS document (the golden's fixed capture-time prefix, or the
 * actual's current session-configured prefix) — into a stable placeholder, so
 * a value/key built under one prefix session compares equal to the same
 * value/key built under a different one.
 *
 * Matches are anchored at an identifier-start boundary (string start, or
 * immediately after a non-alphanumeric character — `.`, `(`, `,`, `_`,
 * whitespace, …) AND require the prefix to be immediately followed by an
 * uppercase letter (the PascalCase continuation of the object's own name,
 * e.g. `ContosoXyzNoteSubject`, `CustGroup.ContosoExtension`, `classStr(ContosoXyzNoteSubject)`).
 * This keeps the substitution narrow: an incidental occurrence of the prefix
 * text inside unrelated free-form content (e.g. a label) is left alone.
 *
 * `prefix` may be a SET of tokens (see `GOLDEN_CAPTURE_PREFIXES`). Tokens are
 * applied longest-first so a longer prefix is consumed before a shorter one
 * that is its own leading substring (`Contoso` before `Con`) can split it.
 */
export declare function canonicalizePrefix(value: string, prefix: PrefixSpec): string;
//# sourceMappingURL=prefix.d.ts.map