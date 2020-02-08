import { HttpProxyMiddleware } from './http-proxy-middleware';
import { Filter, Options } from './types';

function middleware(context: Filter | Options, options?: Options) {
  const { middleware } = new HttpProxyMiddleware(context, options);
  return middleware;
}

export = middleware;
