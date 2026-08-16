/**
 * Offline X++ / XML Best Practice validator.
 *
 * Checks generated code against the rule set in systemInstructions.ts without
 * requiring xppbp.exe or a Windows VM. Returns structured violations that the
 * model can action in one step.
 *
 * Rules implemented:
 *   SEL001  today() deprecated
 *   SEL002  forceLiterals forbidden (SQL injection risk)
 *   SEL003  crossCompany on joined buffer (must be on driving buffer)
 *   SEL004  Nested while select (N+1 query anti-pattern)
 *   SEL005  Function call in where clause (assign to variable first)
 *   COC001  Default param value copied into CoC wrapper signature
 *   COC002  [ExtensionOf] class not declared final
 *   COC003  [ExtensionOf] class name not ending _Extension
 *   COC004  next not reached exactly once and unconditionally (SYS10028)
 *   COC005  Global function (checkFailed/error/…) called as this.<fn>() on a table buffer
 *   COC006  Re-reading the record the buffer already holds, instead of this.orig()
 *   BP001   Hardcoded string literal in info/warning/error/checkFailed
 *   BP002   doInsert/doUpdate/doDelete outside explicit migration comment
 *   BP003   Generic doc-comment (/// Foo class. / /// methodName.)
 *   BP004   Developer-only statements left in code (pause / print)
 *   BP005   an enum SYMBOL (enum2Symbol / value2Symbol) in user-facing text — never translated
 *   FN001   fixed-arity built-in called with the wrong number of arguments
 *   TTS001  Unbalanced ttsbegin / ttscommit
 *   XML001  AxTable XML missing an index with <AlternateKey>Yes</AlternateKey>
 *   XML006  AxTable elements out of canonical order (silently dropped by the AOT)
 *   XML007  Table-level property that does not exist in the AxTable model
 *
 * Keyword scans run against a comment/string-masked copy of the source
 * (maskStringsAndComments) to avoid false positives inside literals/comments.
 *
 * Data-driven property rules (thresholds mined from STANDARD models into the
 * property_stats table during build-database; static defaults when no stats):
 *   XML002  AxTable missing <Label>
 *   XML003  AxTable missing <TableGroup> (suggests the most common standard values)
 *   XML004  AxTableField without <ExtendedDataType>/<EnumType>
 *   XML005  AxTable missing <ClusteredIndex> (only when standard usage ≥ threshold)
 */
import { z } from 'zod';
export declare const validateXppArgsSchema: z.ZodObject<{
    code: z.ZodString;
    codeType: z.ZodDefault<z.ZodOptional<z.ZodEnum<{
        "xml-any": "xml-any";
        "xml-table": "xml-table";
        xpp: "xpp";
    }>>>;
    context: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export interface ValidationViolation {
    rule: string;
    severity: 'error' | 'warning';
    line?: number;
    excerpt: string;
    fix: string;
}
/**
 * Lightweight tokenizer-lite: returns a copy of `code` with the CONTENT of string
 * literals, line comments (//…) and block comments (/* … *\/) replaced by spaces,
 * preserving every newline (so line numbers stay correct) and overall length (so
 * offsets stay correct). Keyword/regex scans run against this masked text to avoid
 * false positives from keywords that appear inside strings or comments.
 */
export declare function maskStringsAndComments(code: string): string;
/**
 * Provider of mined property statistics — implemented by XppSymbolIndex.
 * When unavailable (offline use, stats not built), the rules fall back to
 * STATIC_PROPERTY_DEFAULTS.
 */
export interface PropertyStatsProvider {
    getPropertyPresenceRatio(nodeType: string, property: string): {
        present: number;
        total: number;
        ratio: number;
    };
    getPropertyValueDistribution(nodeType: string, property: string, limit?: number): Array<{
        value: string;
        count: number;
    }>;
}
export declare function runRules(code: string, codeType: 'xpp' | 'xml-table' | 'xml-any', stats?: PropertyStatsProvider): ValidationViolation[];
export declare function validateXppTool(request: any, serverContext?: {
    symbolIndex?: PropertyStatsProvider;
}): Promise<any>;
//# sourceMappingURL=validateXpp.d.ts.map