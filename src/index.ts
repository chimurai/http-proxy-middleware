import { HttpProxyMiddleware } from './http-proxy-middleware';
import type { Options, RequestHandler } from './types';

export function createProxyMiddleware(options: Options): RequestHandler {
  const { middleware } = new HttpProxyMiddleware(options);
  return middleware;
}

export * from './handlers';

export type { Filter, Options, RequestHandler } from './types';

/**
 * Default plugins
 */
export * from './plugins/default';

/**
 * Legacy exports
 */
export * from './legacy';
