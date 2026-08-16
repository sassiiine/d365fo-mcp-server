import type { Request, Response, NextFunction } from 'express';
import { type KeyPrincipal } from '../auth/apiKeyStore.js';
declare global {
    namespace Express {
        interface Request {
            /** Set by apiKeyAuth once a key resolves. Absent when auth is disabled. */
            principal?: KeyPrincipal;
        }
    }
}
/**
 * The address the HTTP transport binds to.
 *
 * An explicit HOST always wins — the operator asked for it. With none set the
 * default depends on whether authentication is accounted for, because the same
 * default cannot be right for both callers: a container or App Service has to
 * bind `0.0.0.0` to be reachable at all, while a developer running
 * `npm start` on a laptop wants the network left alone. Keying the default off
 * the key rather than off NODE_ENV means the safe choice needs no ceremony and
 * the exposed choice is the one that had to be asked for.
 */
export declare function resolveBindHost(env?: NodeJS.ProcessEnv): string;
/**
 * Startup guard for HTTP mode: never serve a network-reachable listener
 * without authentication.
 *
 * `apiKeyAuth` degrades to a pass-through when `API_KEY` is empty, so a
 * listener on a non-loopback address without a key exposes every read tool —
 * including the `source_snippet` fields that carry the customer's own X++ — to
 * anonymous callers. Rather than fail open, refuse to start.
 *
 * The condition is what the socket actually does, not what NODE_ENV claims.
 * The earlier NODE_ENV=production form depended on the operator having set a
 * variable that nothing enforces: the Bicep template sets it, but
 * `.azure-pipelines/d365fo-mcp-app-deploy.yml` deploying onto a hand-created
 * App Service does not, and that deployment was exactly as exposed while the
 * guard stayed quiet. Binding a public interface is the thing that carries the
 * risk, so it is the thing that gates.
 *
 * `ALLOW_UNAUTHENTICATED=true` is the documented opt-out for deployments that
 * terminate authentication upstream (App Service Easy Auth, a Private
 * Endpoint, or an authenticating reverse proxy) and genuinely do not need a
 * key of their own.
 *
 * Returns the operator-facing error message, or null when startup may proceed.
 */
export declare function authStartupError(env?: NodeJS.ProcessEnv): string | null;
/**
 * Express middleware that enforces API key authentication.
 * Mount BEFORE any route handlers.
 */
export declare function apiKeyAuth(req: Request, res: Response, next: NextFunction): Promise<void>;
//# sourceMappingURL=apiKeyAuth.d.ts.map