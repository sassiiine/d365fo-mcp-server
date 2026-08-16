/**
 * X++ XML documentation comment generator.
 *
 * D365FO best practice: every public and protected method must be documented
 * with /// <summary>, /// <param name="…"> and /// <returns> blocks.
 *
 * This module auto-generates those comments when they are absent so that
 * generated AX object XML always conforms to the standard.
 */
/**
 * Ensures there is exactly one blank line between the last member-variable
 * declaration and the closing `}` of the class body in an X++ class declaration.
 *
 * D365FO convention (visible in all Microsoft standard classes):
 *   public class MyClass
 *   {
 *       TransDate fromDate;
 *       str       selectedZoneIds;
 *                                    ← blank line here
 *   }
 *
 * Idempotent: already-correct declarations (and empty class bodies) are returned
 * unchanged.
 */
export declare function ensureBlankLineBeforeClosingBrace(declaration: string): string;
/**
 * Ensures every public or protected X++ method / class declaration has a
 * leading XML doc-comment block (/// <summary> … </summary>) including
 * `<param>` entries for every parameter and a `<returns>` entry for non-void
 * return types.
 *
 * When a doc block is already present (e.g. authored by the AI model) it is
 * kept verbatim, but any missing `<param>` / `<returns>` elements are appended
 * so the result always satisfies the D365FO Best Practice documentation rules.
 * Idempotent — a complete block is returned unchanged. Private / internal
 * methods are left as-is per D365FO convention.
 */
export declare function ensureXppDocComment(source: string): string;
//# sourceMappingURL=xppDocGen.d.ts.map