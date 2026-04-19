import { createServer } from 'node:net';

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

/**
 * Detects if the current environment supports IPv6
 * Used to conditionally run tests that require IPv6 support
 */
export async function isIPv6Available(): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();

    const done = (result: boolean) => {
      server.removeAllListeners('error');
      server.close(() => resolve(result));
    };

    server.once('error', () => done(false));
    server.listen(0, '::1', () => done(true));
  });
}
