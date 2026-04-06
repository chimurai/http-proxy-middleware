import express, { type Express, type RequestHandler } from 'express';

export {
  createProxyMiddleware,
  createHonoProxyMiddleware,
  responseInterceptor,
  fixRequestBody,
} from '../../src/index.js';

export function createApp(...middlewares: RequestHandler[]): Express {
  const app = express();
  app.use(...middlewares);
  return app;
}

export function createAppWithPath(path: string | string[], middleware: RequestHandler): Express {
  const app = express();
  app.use(path, middleware);
  return app;
}
