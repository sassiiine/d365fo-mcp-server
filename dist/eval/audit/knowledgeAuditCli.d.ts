/**
 * Knowledge-audit CLI.
 *
 *   npm run eval:knowledge-audit            # verify against the committed snapshot (CI, VM-free)
 *   npm run eval:knowledge-audit -- --capture   # re-audit against the real symbol index (VM only)
 *   npm run eval:knowledge-audit -- --json
 *
 * --capture opens data/xpp-metadata.db (override with DB_PATH), resolves every
 * reference, prints the defect list and rewrites eval/knowledge-audit.snapshot.json.
 * The default (verify) mode needs no DB: it recomputes the reference set from
 * KNOWLEDGE_BASE and fails when any reference is missing from the snapshot —
 * so a knowledge edit cannot ship without being re-audited on the VM.
 *
 * Exit code 1 on any defect, so it drops straight into the eval-gate workflow.
 */
export {};
//# sourceMappingURL=knowledgeAuditCli.d.ts.map