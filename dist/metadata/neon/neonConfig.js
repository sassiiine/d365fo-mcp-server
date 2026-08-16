/** Returns a Neon config from env, or null if Neon is not configured. */
export function readNeonConfig(env = process.env) {
    const connectionString = env.NEON_DATABASE_URL || env.DATABASE_URL;
    if (!connectionString)
        return null;
    return {
        connectionString,
        schema: env.NEON_INDEX_SCHEMA || 'arch_a',
        maxPoolSize: Number(env.NEON_POOL_MAX || 5),
    };
}
//# sourceMappingURL=neonConfig.js.map