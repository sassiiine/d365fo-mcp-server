/**
 * The phrasings already tried against the labels index, and how many calls tried them.
 *
 * Every search result says rephrasing does not help; callers rephrase anyway.
 * Naming the wordings they already tried is harder to argue with than the same
 * advice stated in the abstract.
 *
 * Advisory, not a refusal: this process outlives one chat session, so leftover
 * state must never block a legitimate first search. Hence the TTL and a note.
 */
/** Record one search and whether it came back empty-handed. */
export declare function recordLabelSearch(query: string, fruitless: boolean): void;
/** Phrasings tried in this session that found nothing, oldest first. */
export declare function fruitlessLabelSearches(): string[];
/**
 * Count one search CALL, whatever it is about to return.
 *
 * Separate from recordLabelSearch because that one only counts what a phrasing
 * found, and a phrasing that hit something irrelevant is invisible to it. Run
 * 7b8de4ba is the case: six batches / 24 phrasings in, the notice was still
 * reporting "11 phrasing(s) already came back empty", because the other thirteen
 * had each landed on some unrelated SYS label and were never counted.
 */
export declare function recordLabelSearchCall(): void;
/** Search calls made in this session. */
export declare function labelSearchCallCount(): number;
/**
 * The hard stop, once the caller is past the budget. Empty until then.
 *
 * Unlike repeatSearchNotice this does not care whether the searches came back
 * empty: the expensive loop is the one where every batch DOES return something,
 * none of it about the caller's subject, and the verdict reads as encouragement
 * to try another wording. Both branches carry this, so the count is the thing
 * that ends the loop rather than the luck of the phrasing.
 *
 * Names the escalations that follow the loop in practice — reading the
 * .label.txt files by hand, asking the user — because those cost more than the
 * searches did and are what the caller reaches for once it stops rephrasing.
 */
export declare function searchBudgetNotice(): string;
/**
 * The line that goes at the top of a no-hit answer once the caller has been here
 * before. Empty until then — the first miss is ordinary and needs no lecture.
 *
 * `excluding` drops the current call's own phrasings, so a six-query batch does
 * not read as six previous attempts.
 */
export declare function repeatSearchNotice(excluding?: readonly string[]): string;
/** Forget everything. Tests only. */
export declare function resetLabelSearchHistory(): void;
//# sourceMappingURL=labelSearchHistory.d.ts.map