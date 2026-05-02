import type { HttpBindings } from '@hono/node-server';
import type { MiddlewareHandler } from 'hono';

import { type Options, createProxyMiddleware } from './index.js';
import { getLogger } from './logger.js';

/**
 * Creates a Hono middleware that proxies requests using http-proxy-middleware.
 *
 * `@remarks`
 * This middleware requires Hono to be running on Node.js via `@hono/node-server`.
 * It uses `c.env.incoming` and `c.env.outgoing` which are only available with `HttpBindings`.
 *
 * `@experimental` This API is experimental and may change without a major version bump.
 *
 * `@example`
 * ```ts
 * import { serve } from '@hono/node-server';
 * import { Hono } from 'hono';
 * import { createHonoProxyMiddleware } from 'http-proxy-middleware/hono';
 *
 * const app = new Hono();
 * app.use('/api', createHonoProxyMiddleware({ target: 'http://example.com', changeOrigin: true }));
 * serve(app);
 *
 * @since 4.0.0
 */
export function createHonoProxyMiddleware(
  options: Options,
): MiddlewareHandler<{ Bindings: HttpBindings }> {
  const proxy = createProxyMiddleware<HttpBindings['incoming'], HttpBindings['outgoing']>(options);
  const logger = getLogger(options);

  return (c, next) => {
    return new Promise<void>((resolve, reject) => {
      proxy(c.env.incoming, c.env.outgoing, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    })
      .then(() => next())
      .catch((err) => {
        logger.error('Proxy error:', err);
        return c.text('Proxy Error', 500);
      });
  };
}
