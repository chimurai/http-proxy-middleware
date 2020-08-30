import * as express from 'express';
import { Express, RequestHandler } from 'express';

export { createProxyMiddleware } from '../../dist/index';

export function createApp(middleware: RequestHandler): Express {
  const app = express();
  app.use(middleware);
  return app;
}

export function createAppWithPath(path: string | string[], middleware: RequestHandler): Express {
  const app = express();
  app.use(path, middleware);
  return app;
}
