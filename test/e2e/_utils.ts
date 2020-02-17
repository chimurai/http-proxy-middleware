import * as express from 'express';

export { createProxyMiddleware } from '../../dist/index';

export function createServer(portNumber, middleware, path?) {
  const app = express();

  if (middleware && path) {
    app.use(path, middleware);
  } else if (middleware) {
    app.use(middleware);
  }

  const server = app.listen(portNumber);

  return server;
}
