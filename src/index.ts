import { HttpProxyMiddleware } from './http-proxy-middleware';

function proxy(context, opts) {
  const { middleware } = new HttpProxyMiddleware(context, opts);
  return middleware;
}

export = proxy;
