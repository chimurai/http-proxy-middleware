import { HttpProxyMiddleware } from './http-proxy-middleware';
import type { Options, RequestHandler } from './types';
import type * as http from 'http';

export function createProxyMiddleware<TReq = http.IncomingMessage, TRes = http.ServerResponse>(
  options: Options<TReq, TRes>
): RequestHandler<TReq, TRes> {
  const { middleware } = new HttpProxyMiddleware<TReq, TRes>(options);
  return middleware as unknown as RequestHandler<TReq, TRes>;
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
