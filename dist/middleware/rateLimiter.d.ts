import type { Request, RequestHandler } from 'express';
export declare function generateRateLimitKey(req: Request): string;
/**
 * Express middleware entry point. Delegates to the limiter, constructing it on
 * the first request so it picks up the fully loaded configuration.
 */
export declare const apiRateLimiter: RequestHandler;
//# sourceMappingURL=rateLimiter.d.ts.map