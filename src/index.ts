import { HttpProxyMiddleware } from './http-proxy-middleware';
import { Options } from './types';

export function createProxyMiddleware(options: Options) {
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

export { Filter, Options, RequestHandler } from './types';
