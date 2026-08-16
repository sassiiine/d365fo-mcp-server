/**
 * The single XML escaper for every metadata builder.
 *
 * Most builders in src/tools interpolate caller-supplied strings straight into
 * XML template literals. Labels, descriptions, help text and developer
 * documentation are free text, so an ampersand or angle bracket in any of them
 * (`label: "Purchases & Sales"`) writes malformed XML into
 * PackagesLocalDirectory — and the create path adds the file to the .rnrproj
 * before anything parses it, so the failure surfaces much later as an
 * unexplained build break.
 *
 * Before this module five builders carried their own private copy of the
 * escaper and disagreed about what to escape, while the rest escaped nothing at
 * all. Import from here instead of writing a sixth.
 *
 * IMPORTANT: escaping is not idempotent — `&` becomes `&amp;`, so applying it
 * twice yields `&amp;amp;`. Escape at the point where a raw value enters XML,
 * never on a fragment that is already XML.
 */
/**
 * Escape a value for use as XML **text content**.
 *
 * Only `&`, `<` and `>` are escaped, matching what the Microsoft metadata
 * serializer emits for text nodes — escaping quotes here too would round-trip
 * correctly but make our files differ needlessly from shipped ones.
 */
export declare function escapeXml(value: unknown): string;
/**
 * Escape a value for use inside a double-quoted XML **attribute**.
 * Adds `"` to the text-content set so the attribute cannot be terminated early.
 */
export declare function escapeXmlAttr(value: unknown): string;
/**
 * Decode XML entities from X++ source code.
 *
 * X++ source should never contain entity-encoded characters — `/// <summary>`
 * doc comments, generic types like `List<str>`, and comparison operators like
 * `x < y` all use literal `<` and `>`. When an AI model copies code from an
 * SSRS report's entity-encoded <Text> block and passes it as `methodCode`, the
 * entities would otherwise survive into the CDATA section and corrupt the source.
 *
 * Lives here, beside escapeXml, because it is that function's inverse — and
 * because its previous home was the modify TOOL, which made src/utils/
 * smartXmlBuilder.ts import from src/tools/ to reach it: a three-module cycle
 * running the wrong way across the layer boundary.
 */
export declare function decodeXmlEntitiesFromXppSource(source: string): string;
//# sourceMappingURL=xmlEscape.d.ts.map