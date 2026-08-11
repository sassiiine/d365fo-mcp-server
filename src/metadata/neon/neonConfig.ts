/**
 * Configuration for the Neon (Postgres) index backend.
 *
 * The MCP reads these from the environment so a deployment can point at Neon
 * without code changes. When NEON_DATABASE_URL is unset the server keeps using
 * the local SQLite index (see makeIndexBackend()).
 */
export interface NeonIndexConfig {
  /** POOLED Neon connection string (host with `-pooler`). Runtime queries only. */
  connectionString: string;
  /** Schema the index lives in. Default 'arch_a'. */
  schema: string;
  /** Max TCP connections in this process's pool. Keep small — total load on
   *  Neon = this × number of running instances. Default 5. */
  maxPoolSize: number;
}

/** Returns a Neon config from env, or null if Neon is not configured. */
export function readNeonConfig(env: NodeJS.ProcessEnv = process.env): NeonIndexConfig | null {
  const connectionString = env.NEON_DATABASE_URL || env.DATABASE_URL;
  if (!connectionString) return null;
  return {
    connectionString,
    schema: env.NEON_INDEX_SCHEMA || 'arch_a',
    maxPoolSize: Number(env.NEON_POOL_MAX || 5),
  };
}
