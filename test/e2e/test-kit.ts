import * as express from 'express';
import type { Express, RequestHandler } from 'express';

export { createProxyMiddleware, responseInterceptor, fixRequestBody } from '../../src/index';

export function createApp(...middlewares): Express {
  const app = express();
  app.use(...middlewares);
  return app;
}

export function createAppWithPath(path: string | string[], middleware: RequestHandler): Express {
  const app = express();
  app.use(path, middleware);
  return app;
}
