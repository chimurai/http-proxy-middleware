import * as express from 'express';

export { createProxyMiddleware } from '../../dist/index';

export function createApp(middleware) {
  const app = express();
  app.use(middleware);
  return app;
}

export function createAppWithPath(path, middleware) {
  const app = express();
  app.use(path, middleware);
  return app;
}
