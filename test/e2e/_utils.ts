import * as express from 'express';

// tslint:disable-next-line: no-var-requires
export const proxyMiddleware = require('../../dist/index');

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

export function createServerWithFallthrough(portNumber, middleware) {
  const app = express();

  app.use(middleware);
  app.use((request, response, next) => {
    response.end('fell through');
  })

  const server = app.listen(portNumber);

  return server;
}
