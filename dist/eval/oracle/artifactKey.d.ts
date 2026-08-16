/**
 * Multi-artifact filename → stable logical key, for pairing a committed golden
 * artifact with the actual file that reproduces it.
 *
 * Golden dirs under `eval/goldens/` use TWO filename conventions
 * (docs/eval-sweep-findings-2026-07-21.md #2):
 *
 *   legacy   `DemoEnumExtProbe.AxClass.metadata.xml`   — UNPREFIXED stem plus an
 *            `.Ax<Type>` infix, although the file CONTENT is `Con`-prefixed
 *            (`<Name>ConDemoEnumExtProbe</Name>`)
 *   current  `ConDemoEnumExtProbe.metadata.xml`        — prefixed stem, no infix
 *
 * while the actual artifact copied off the VM is always named after the object
 * as it exists on disk (`ConDemoEnumExtProbe.metadata.xml`). Comparing raw
 * filenames — or prefix-canonicalised filenames — therefore paired NOTHING for a
 * legacy dir, and the whole artifact scored as missing + extra even when its
 * content was byte-identical.
 *
 * Rather than renaming committed goldens (a golden's bytes are the regression
 * anchor), both sides are reduced to the same logical key:
 *
 *   1. drop the `.metadata.xml` suffix,
 *   2. drop a legacy `.Ax<Type>` type infix,
 *   3. drop a `.<prefix>Extension` dot-notation extension marker,
 *   4. canonicalise the EXTENSION_PREFIX to `PFX` (see `canonicalizePrefix`),
 *   5. drop a LEADING `PFX` — legacy golden filenames omit the prefix the file
 *      content carries, so prefixed and unprefixed stems must compare equal.
 *
 * Steps 2/3/5 are lossy, so `artifactKeyMap` refuses to apply them where they
 * would make two DIFFERENT filenames on the same side collide (e.g. a dir
 * holding both `CustGroup` and `CustGroup.ConExtension`): a colliding name keeps
 * its raw filename as its key, degrading to the previous exact-match behaviour
 * instead of silently diffing an extension against its base object.
 */
import { type PrefixSpec } from './prefix.js';
/**
 * Reduce one artifact filename to its logical key. Exported for tests; callers
 * pairing a SET of names should use `artifactKeyMap`, which additionally
 * protects against two names collapsing onto the same key.
 */
export declare function artifactKey(filename: string, prefix?: PrefixSpec): string;
/**
 * Key every name in `names` (one side of a diff), keeping a name's RAW filename
 * as its key whenever the reduced key is not unique within that side. Returns a
 * `filename → key` map.
 */
export declare function artifactKeyMap(names: readonly string[], prefix?: PrefixSpec): Map<string, string>;
//# sourceMappingURL=artifactKey.d.ts.map