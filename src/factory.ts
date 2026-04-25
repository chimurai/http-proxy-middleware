import type * as http from 'node:http';

import { HttpProxyMiddleware } from './http-proxy-middleware.js';
import type { NextFunction, Options, RequestHandler } from './types.js';

/**
 * Create proxy middleware for Express-like servers. ([list of servers with examples](https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/servers.md))
 *
 * @example Basic proxy to a single target.
 * ```ts
 * import { createProxyMiddleware } from 'http-proxy-middleware';
 *
 * const proxy = createProxyMiddleware({
 *   target: 'http://www.example.org',
 *   changeOrigin: true,
 * });
 * ```
 *
 * @example Proxy only matching paths and rewrite the forwarded path.
 * ```ts
 * import { createProxyMiddleware } from 'http-proxy-middleware';
 *
 * const proxy = createProxyMiddleware({
 *   target: 'http://localhost:3000',
 *   pathFilter: '/api',
 *   pathRewrite: {
 *     '^/api/': '/',
 *   },
 * });
 * ```
 *
 * @example Native path rewrite by mounting at a route (alternative to `pathRewrite`).
 * ```ts
 * import express from 'express';
 * import { createProxyMiddleware } from 'http-proxy-middleware';
 *
 * const app = express();
 * app.use(
 *   '/users',
 *   createProxyMiddleware({
 *     target: 'http://jsonplaceholder.typicode.com/users',
 *     changeOrigin: true,
 *   }),
 * );
 * ```
 *
 * @example Use framework-specific request/response types (Express).
 * ```ts
 * import type { Request, Response } from 'express';
 * import { createProxyMiddleware } from 'http-proxy-middleware';
 *
 * const proxy = createProxyMiddleware<Request, Response>({
 *   target: 'http://www.example.org/api',
 *   changeOrigin: true,
 * });
 * ```
 *
 * @example Intercept and modify a proxied response body.
 * ```ts
 * import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
 *
 * const proxy = createProxyMiddleware({
 *   target: 'http://www.example.org',
 *   selfHandleResponse: true,
 *   on: {
 *     proxyRes: responseInterceptor(async (responseBuffer) => {
 *       const response = responseBuffer.toString('utf8');
 *       return response.replace('Hello', 'Goodbye');
 *     }),
 *   },
 * });
 * ```
 *
 * @see https://github.com/chimurai/http-proxy-middleware/
 * @see https://github.com/chimurai/http-proxy-middleware/#basic-usage
 * @see https://github.com/chimurai/http-proxy-middleware/#intercept-and-manipulate-responses
 * @see https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/servers.md
 * @see https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/pathFilter.md
 * @see https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/pathRewrite.md
 * @see https://github.com/chimurai/http-proxy-middleware/blob/master/recipes/response-interceptor.md
 */
export function createProxyMiddleware<
  TReq extends http.IncomingMessage = http.IncomingMessage,
  TRes extends http.ServerResponse = http.ServerResponse,
  TNext = NextFunction,
>(options: Options<TReq, TRes>): RequestHandler<TReq, TRes, TNext> {
  const { middleware } = new HttpProxyMiddleware<TReq, TRes>(options);
  return middleware as unknown as RequestHandler<TReq, TRes, TNext>;
}
