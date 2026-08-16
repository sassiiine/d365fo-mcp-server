/**
 * Knowledge-base reference extraction.
 *
 * Pulls every *named AOT type / API* out of the embedded KNOWLEDGE_BASE
 * (src/tools/xppKnowledge.ts) so it can be resolved against the real symbol
 * index. Rationale: generated code is gated fail-closed by validate_code and
 * the build, but knowledge content shipped to the model was never gated at
 * all — that asymmetry is what the public review of the part-4 article
 * exposed (a `SysRunnable::run()` that does not exist in the AOT).
 *
 * Extraction is deliberately *conservative*: only shapes where a PascalCase
 * token is unambiguously an AOT element reference are emitted, so an
 * unresolved reference is a real defect rather than prose noise. Everything
 * this module does is pure string work — no DB, no VM — so it is unit
 * testable and runs anywhere.
 */
import type { KnowledgeEntry } from '../../tools/knowledge/xppKnowledge.js';
/** How a reference was recognised — drives the resolver's expectations. */
export type RefKind = 'static-call' | 'extends' | 'new' | 'attribute' | 'intrinsic' | 'declaration';
export interface KnowledgeRef {
    /** Knowledge entry id the reference came from. */
    entryId: string;
    /** The AOT element name as written in the knowledge content. */
    name: string;
    /** For 'static-call': the method after `::`. */
    member?: string;
    kind: RefKind;
    /** Which field of the entry it was found in (for defect reporting). */
    field: string;
    /** Stable key used by the snapshot: entryId|kind|name[::member]. */
    key: string;
}
/** Extract every AOT reference from one knowledge entry. */
export declare function extractEntryRefs(entry: KnowledgeEntry): KnowledgeRef[];
/** Extract references from the whole knowledge base, in entry order. */
export declare function extractKnowledgeRefs(base: KnowledgeEntry[]): KnowledgeRef[];
//# sourceMappingURL=knowledgeRefs.d.ts.map