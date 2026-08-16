/**
 * In-memory provenance store for grounding tokens.
 *
 * A grounding token proves that the model queried the real D365FO codebase
 * (via prepare_change) before generating extension code. Tokens expire after
 * TTL_MS to prevent stale context being reused across sessions.
 *
 * Enforcement: when GROUNDING_ENFORCE=true, extension patterns in generate_object(mode="pattern")
 * and extension objectTypes in create_d365fo_file will reject calls without a
 * valid token.
 */
export interface ProvenanceContext {
    goal: string;
    objectName: string;
    methodName?: string;
    objectType?: string;
    /** Proposed name of the new extension object, when supplied to prepare_change */
    proposedName?: string;
    /** Condensed facts gathered by prepare_change */
    methodSignature?: string;
    cocExtensions?: string;
    extensionEligibility?: string;
    recommendedStrategy?: string;
    namingValidation?: string;
    patterns?: string;
}
export interface ProvenanceBundle {
    token: string;
    context: ProvenanceContext;
    timestamp: number;
    expiresAt: number;
}
export declare function createProvenanceToken(context: ProvenanceContext): string;
export declare function getProvenanceBundle(token: string): ProvenanceBundle | undefined;
export declare function isValidToken(token: string): boolean;
/**
 * Check that a token was issued for the object actually being written.
 *
 * A token issued for `CustTable` is accepted for targets that EMBED that name
 * at the start (`CustTable.ContosoExtension`, `CustTableContoso_Extension`, …)
 * and for the proposedName recorded by prepare_change. D365FO extension naming
 * always leads with the base object name, so a prefix match is used rather
 * than a bare substring match. Names shorter than 4 chars are compared exactly
 * to avoid trivial matches.
 */
export declare function tokenMatchesTarget(bundle: ProvenanceBundle, targetObjectName: string): boolean;
export declare function enforceGrounding(groundingToken: string | undefined, operationDescription: string, targetObjectName?: string): {
    isError: true;
    content: [{
        type: 'text';
        text: string;
    }];
} | null;
//# sourceMappingURL=provenanceStore.d.ts.map