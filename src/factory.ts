import type * as http from 'node:http';

import { HttpProxyMiddleware } from './http-proxy-middleware';
import type { NextFunction, Options, RequestHandler } from './types';

export function createProxyMiddleware<
  TReq extends http.IncomingMessage = http.IncomingMessage,
  TRes extends http.ServerResponse = http.ServerResponse,
  TNext = NextFunction,
>(options: Options<TReq, TRes>): RequestHandler<TReq, TRes, TNext> {
  const { middleware } = new HttpProxyMiddleware<TReq, TRes>(options);
  return middleware as unknown as RequestHandler<TReq, TRes, TNext>;
}
