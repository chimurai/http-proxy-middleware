import type * as http from 'http';

import { HttpProxyMiddleware } from './http-proxy-middleware';
import type { NextFunction, Options, RequestHandler } from './types';

export function createProxyMiddleware<
  TReq = http.IncomingMessage,
  TRes = http.ServerResponse,
  TNext = NextFunction,
>(options: Options<TReq, TRes>): RequestHandler<TReq, TRes, TNext> {
  const { middleware } = new HttpProxyMiddleware<TReq, TRes>(options);
  return middleware as unknown as RequestHandler<TReq, TRes, TNext>;
}
