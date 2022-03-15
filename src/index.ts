import { HttpProxyMiddleware } from './http-proxy-middleware';
import type { Options, RequestHandler } from './types';

export function createProxyMiddleware(options: Options): RequestHandler {
  const { middleware } = new HttpProxyMiddleware(options);
  return middleware;
}

/**
 * @deprecated
 */
// export function legacyCreateProxyMiddleware(pathFilter: Filter, options: Options) {
//   return createProxyMiddleware({ ...options, pathFilter });
// }

export * from './handlers';

export type { Filter, Options, RequestHandler } from './types';
