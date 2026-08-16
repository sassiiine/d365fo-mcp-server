/**
 * Knowledge-base audit — resolve every AOT reference extracted
 * from KNOWLEDGE_BASE against the real symbol index, so knowledge content is
 * gated the same fail-closed way generated code is.
 *
 * Split from the CLI on purpose: this module is pure (takes a `SymbolLookup`),
 * so it unit-tests VM-free with a fake index, while the CLI supplies either
 * the real 2 GB SQLite index (VM, `--capture`) or the committed snapshot
 * (CI, `--verify`).
 */
import type { KnowledgeRef } from './knowledgeRefs.js';
/** Minimal view of the symbol index the audit needs. */
export interface SymbolLookup {
    /** Case-insensitive element lookup; null when the name is not in the AOT. */
    resolve(name: string): {
        canonical: string;
        types: string[];
    } | null;
    /**
     * Weaker proof of existence: the name is not an indexed element of its own,
     * but real AOT elements declare it as a base class / implemented interface
     * (e.g. `IFeatureMetadata`). Real, just not indexable on its own.
     */
    isReferencedBase(name: string): boolean;
    /** Does `canonical` declare a method named `member` (case-insensitive)? */
    hasMember(canonical: string, member: string): boolean;
}
export type FindingStatus = 'unknown-type' | 'unknown-member' | 'casing';
export interface AuditFinding {
    ref: KnowledgeRef;
    status: FindingStatus;
    detail: string;
}
export interface AuditResult {
    checked: number;
    resolved: number;
    allowed: number;
    findings: AuditFinding[];
}
/**
 * Names that legitimately never appear in the symbol index — .NET BCL types
 * reachable from X++, macro/pseudo identifiers, and platform constructs the
 * metadata parser does not index. Kept as data (not code) in
 * eval/knowledge-audit.allow.json so an exception is always a reviewed,
 * justified entry rather than a silent skip.
 */
export type Allowlist = Record<string, string>;
export declare function auditRefs(refs: KnowledgeRef[], lookup: SymbolLookup, allow?: Allowlist): AuditResult;
export declare function renderFindings(result: AuditResult): string;
export interface AuditSnapshot {
    /** ISO timestamp of the capture run. */
    capturedAt: string;
    /** `last_indexed_at` of the symbol index the capture ran against. */
    indexedAt: string;
    /** Every reference key that resolved cleanly on the VM. */
    ok: string[];
}
export declare function buildSnapshot(refs: KnowledgeRef[], result: AuditResult, indexedAt: string): AuditSnapshot;
/**
 * CI half of the gate: no symbol index available, so every reference must be
 * covered by the committed snapshot. Editing knowledge content therefore
 * requires re-capturing the audit on the VM — knowledge cannot silently drift
 * back to unverified.
 */
export declare function verifyAgainstSnapshot(refs: KnowledgeRef[], snapshot: AuditSnapshot): KnowledgeRef[];
//# sourceMappingURL=knowledgeAudit.d.ts.map