import { HttpProxyMiddleware } from './http-proxy-middleware';
import { Filter, Options } from './types';

export function createProxyMiddleware(context: Filter | Options, options?: Options) {
  const { middleware } = new HttpProxyMiddleware(context, options);
  return middleware;
}

export { Filter, Options, RequestHandler } from './types';
