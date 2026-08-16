/** Who a presented key belongs to. */
export interface KeyPrincipal {
    /** Customer name from the table, or '(root)' for the env-var operator key. */
    customer: string;
    /** True when the caller authenticated with the env `API_KEY`. */
    isRoot: boolean;
}
/** Is a customer key store available at all? */
export declare function keyStoreConfigured(): boolean;
export declare function hashKey(key: string): string;
/** Generate a new key. 256 bits of CSPRNG, hex-encoded. */
export declare function generateKey(): string;
/**
 * Resolve a presented key, or null if it is not valid.
 *
 * The env `API_KEY` is checked first and without a database, so the operator key
 * keeps working when Neon is unreachable — otherwise a database outage would
 * lock out the very access needed to diagnose it.
 */
export declare function resolveApiKey(presented: string): Promise<KeyPrincipal | null>;
/** Drop cached decisions. Used by tests and after issuing/revoking in-process. */
export declare function clearKeyCache(): void;
/** Release the pool so a process can exit without waiting on Neon. */
export declare function closeKeyStore(): Promise<void>;
//# sourceMappingURL=apiKeyStore.d.ts.map