/**
 * Run the offline X++ rules (COC*, BP*, SEL*, TTS001) on the source a write is
 * carrying, so they no longer depend on the caller thinking to call
 * validate_code. Pure string analysis over text we already hold.
 *
 * Advisory, not blocking: a rule that refuses a write has to be right every
 * time, one that annotates it only has to be useful.
 */
/**
 * Pull the `<Declaration>` out of an AOT class/table XML — never the methods:
 * only code the caller sent in this call is validated.
 */
export declare function extractDeclaration(xml: string): string | null;
/**
 * Validate the X++ a write is carrying.
 *
 * @param suppliedSource  the caller's own text (sourceCode / methodCode / newCode).
 *                        Nothing else is inspected — never the rest of the file.
 * @param declarationXml  raw XML of the target object, when the write has one on
 *                        disk; used only to recover the enclosing class header.
 * @returns a markdown note to append to the write's reply, or '' when clean.
 */
export declare function validateWrittenXpp(suppliedSource: string | undefined, declarationXml?: string | null): string;
//# sourceMappingURL=inlineXppValidation.d.ts.map