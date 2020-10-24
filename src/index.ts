import { HttpProxyMiddleware } from './http-proxy-middleware';
import { Filter, Options, RequestHandler } from './types';
import * as http from 'http';

export function createProxyMiddleware<
  Request extends http.IncomingMessage,
  Response extends http.ServerResponse
>(
  context: Filter<Request> | Options<Request, Response>,
  options?: Options<Request, Response>
): RequestHandler<Request, Response> {
  const { middleware } = new HttpProxyMiddleware(context, options);
  return middleware;
}

export { Filter, Options, RequestHandler } from './types';
