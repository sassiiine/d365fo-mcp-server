/**
 * X++ method-source re-indentation.
 *
 * Re-derives indentation from block structure alone, discarding whatever leading
 * whitespace the input had, so output is consistent regardless of how the
 * caller indented a method body.
 *
 * Microsoft convention (verified against shipped platform code, e.g.
 * ApplicationFoundation/AxClass/AVActionCompletedEventData.xml): the doc
 * comment + signature line sit at one indent level (4 spaces) — the matching
 * `{`/`}` sit at that same level, and nested content goes one level deeper
 * per brace.
 *
 * A `case`/`default` label also opens a level even though it opens no brace
 * (ApplicationFoundation/AxClass/AVTimeframe.xml). Deriving depth from braces
 * alone flattened every case body onto its label —
 *
 *     case QualityTier::None:
 *     return "@None";
 *
 * — and it did that to correct input too, so a well-formatted switch handed in
 * came back wrong and had to be repaired by hand afterwards.
 *
 * A statement continued onto further lines indents those lines one level past
 * its first line. Brace depth alone cannot see this — no brace opens — so a
 * wrapped statement came back flattened onto one level, again including
 * correct input:
 *
 *     select firstonly oldRecord
 *     where oldRecord.RecId == this.RecId;
 *
 * That is what a caller who wrapped the `where` (and the `&&` of a wrapped
 * `if`) got back after `d365fo_file` wrote the method.
 *
 * "Is this statement finished?" is asked of the line's CODE, never its raw text.
 * Asked of the raw text, a trailing comment hid the `;` —
 *
 *     ttsbegin; // start
 *         ttscommit;
 *
 * — and every line after one got a level it had not earned. The result was
 * stable under re-formatting, so nothing ever put it back.
 */
/**
 * Re-indent an X++ method source block (doc comment + signature + body) to
 * the D365FO convention. `baseDepth` is the indent level (in 4-space units)
 * of the signature line itself — 1 for a method embedded in a class/table
 * <Source> element (the standard case), matching real shipped code.
 */
export declare function reindentXppSource(source: string, baseDepth?: number): string;
/**
 * A method's X++ as D365FO stores it inside `<Source><![CDATA[ … ]]>`.
 *
 * Shipped metadata ends every method with a blank line before the `]]>`, so the
 * methods of a class are separated by one when the AOT reassembles them. The
 * re-indenter deliberately trims trailing blanks, and the writers that did not
 * add one back produced classes whose methods sit directly on top of each
 * other — visible in Visual Studio, and in the XML against any shipped file.
 */
export declare function xppMethodSourceForXml(source: string): string;
//# sourceMappingURL=xppFormat.d.ts.map