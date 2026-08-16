/**
 * Server-side validation of generated AOT XML.
 *
 * Runs in the cloud, before XML is handed to the customer's agent, so a defect
 * is caught in the second it takes to check rather than after a file is written,
 * a project is built, and a compiler reports something several steps removed
 * from the cause.
 *
 * Every rule here is derived from a defect that actually shipped and was
 * reproduced - not from a style guide. Each carries the evidence in its comment.
 *
 * The rules are also the part of the product that cannot be copied by reading:
 * get_knowledge hands over text, which is the same asset after one request as it
 * was before. A rule that EXECUTES against a 1.15M-symbol index is only useful
 * where the index is.
 */
export type Severity = 'error' | 'warning';
export interface ValidationFinding {
    severity: Severity;
    /** Stable kebab-case id, safe to key metrics off. */
    rule: string;
    message: string;
    /** What to do about it. */
    hint?: string;
    /** Object/element path, when the rule can place it. */
    location?: string;
}
export interface ValidationContext {
    objectType?: string;
    /** Absent when Neon is unconfigured; rules needing it then stay silent. */
    edtTypes?: import('./edtTypeLookup.js').EdtTypeLookup | null;
}
/**
 * Validate generated AOT XML. Returns findings, most severe first; empty means
 * nothing known to be wrong (NOT a proof of correctness).
 */
export declare function validateGeneratedXml(xml: string, ctx?: ValidationContext): Promise<ValidationFinding[]>;
/** One document in a set being validated together. */
export interface ObjectDoc {
    objectType: string;
    name: string;
    xml: string;
}
/**
 * Rules that need MORE THAN ONE object to be decidable.
 *
 * A form and the table it binds are each valid alone and invalid together: the
 * form referenced field group 'Overview', the table declared only the empty
 * Auto* groups, and xppc blamed the FORM for something caused by the TABLE.
 * Single-document validation cannot see that by construction, so this pass takes
 * the whole set the caller is about to write.
 *
 * Only pairs present in the SET are judged. A form whose table is not included
 * is not accused of anything - the table may exist already and be perfectly
 * correct, and guessing would make the findings untrustworthy.
 */
export declare function validateObjectSet(docs: ObjectDoc[]): ValidationFinding[];
/** Render findings for a tool response. Empty string when there are none. */
export declare function formatFindings(findings: ValidationFinding[]): string;
//# sourceMappingURL=cloudValidator.d.ts.map