import { HttpProxyMiddleware } from './http-proxy-middleware';
import { Filter, Options } from './types';

export function createProxyMiddleware(context: Filter | Options, options?: Options) {
  const { middleware } = new HttpProxyMiddleware(context, options);
  return middleware;
}

export function createProxy(context: Filter | Options, options?: Options) {
  return new HttpProxyMiddleware(context, options);
}

export * from './handlers';
export * from './http-proxy-middleware';

export { Filter, Options, RequestHandler } from './types';
