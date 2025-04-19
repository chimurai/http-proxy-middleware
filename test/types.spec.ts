/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as express from 'express';
import * as http from 'http';

import { fixRequestBody, createProxyMiddleware as middleware, responseInterceptor } from '../src';
import type { Options, RequestHandler } from '../src/types';

describe('http-proxy-middleware TypeScript Types', () => {
  let options: Options;

  beforeEach(() => {
    options = {
      target: 'http://example.org',
    };
  });

  describe('createProxyMiddleware()', () => {
    it('should create proxy with just options', () => {
      const proxy = middleware(options);
      expect(proxy).toBeDefined();
    });

    it('should create proxy and accept base http types (req, res) from native http server', () => {
      const proxy = middleware(options);
      const server = http.createServer(proxy);

      expect(proxy).toBeDefined();
      expect(server).toBeDefined();
    });
  });

  describe('HPM Filters', () => {
    it('should create proxy with path filter', () => {
      const proxy = middleware({ ...options, pathFilter: '/api' });
      expect(proxy).toBeDefined();
    });

    it('should create proxy with glob filter', () => {
      const proxy = middleware({ ...options, pathFilter: ['/path/**'] });
      expect(proxy).toBeDefined();
    });

    it('should create proxy with custom filter', () => {
      const proxy = middleware({ ...options, pathFilter: (path, req) => true });
      expect(proxy).toBeDefined();
    });

    it('should create proxy with manual websocket upgrade function', () => {
      const proxy = middleware({ ...options, pathFilter: (path, req) => true });
      expect(proxy.upgrade).toBeDefined();
    });
  });

  describe('http-proxy options', () => {
    it('should extend from http-proxy options', () => {
      options = {
        target: 'http://example',
        ws: true,
      };
      expect(options).toBeDefined();
    });
  });

  describe('http-proxy-middleware options', () => {
    describe('pathRewrite', () => {
      it('should have pathRewrite Type with table', () => {
        options = { pathRewrite: { '^/from': '/to' } };
        expect(options).toBeDefined();
      });

      it('should have pathRewrite Type with function', () => {
        options = { pathRewrite: (path, req) => '/path' };
        expect(options).toBeDefined();
      });

      it('should have pathRewrite Type with async function', () => {
        options = { pathRewrite: async (path, req) => '/path' };
        expect(options).toBeDefined();
      });
    });

    describe('router', () => {
      it('should have router Type with table', () => {
        options = { router: { '^/from': '/to' } };
        expect(options).toBeDefined();
      });

      it('should have router Type with function', () => {
        options = { router: (path) => '/path' };
        expect(options).toBeDefined();
      });

      it('should have router Type with async function', () => {
        options = { router: async (path) => '/path' };
        expect(options).toBeDefined();
      });
    });

    describe('logger', () => {
      it('should have logger option', () => {
        options = { logger: console };
        expect(options).toBeDefined();
      });

      it('should allow custom logger option', () => {
        const customLogger = {
          info: () => {},
          warn: () => {},
          error: () => {},
        };
        options = { logger: customLogger };
        expect(options).toBeDefined();
      });

      it('should fail when custom logger has missing log function', () => {
        const customLogger = {
          info: () => {},
          // warn: () => {},
          error: () => {},
        };
        // @ts-expect-error explanation: should error when customLogger has a missing log function
        options = { logger: customLogger };
        expect(options).toBeDefined();
      });

      it('should fail when invalid logger is provided', () => {
        // @ts-expect-error explanation: should error when invalid logger is provided
        options = { logger: 500 };
        expect(options).toBeDefined();
      });
    });

    describe('on', () => {
      it('should have on events', () => {
        options = {
          on: {
            error: (error, req, res, target) => {},
            proxyReq: (proxyReq, req, res, options) => {},
            proxyReqWs: (proxyReq, req, socket, options) => {},
            proxyRes: (proxyRes, req, res) => {},
            open: (proxySocket) => {},
            close: (proxyRes, proxySocket, proxyHead) => {},
            start: (req, res, target) => {},
            end: (req, res, proxyRes) => {},
            econnreset: (error, req, res, target) => {},

            // @ts-expect-error explanation: should error when unknown event is passed
            unknownEventName: () => {},
          },
        };
        expect(options).toBeDefined();
      });
    });
  });

  describe('express request and response types', () => {
    it('should get TypeScript type errors when express specific properties are used with base types', () => {
      options = {
        on: {
          proxyReq(proxyReq, req, res, options) {
            // @ts-expect-error explanation: should error when express properties are used
            req.params;
          },
          proxyRes(proxyRes, req, res) {
            // @ts-expect-error explanation: should error when express properties are used
            res.status(200).send('OK');
          },
        },
      };

      expect(options).toBeDefined();
    });

    it('should get contextual types from express server', () => {
      const app = express();
      app.use(
        middleware({
          router: (req) => req.params,
          pathFilter: (pathname, req) => !!req.params,
          on: {
            error(error, req, res, target) {
              req.params;

              // https://www.typescriptlang.org/docs/handbook/2/narrowing.html
              if (res instanceof http.ServerResponse) {
                res.status(200).send('OK');
              }
            },
            proxyReq(proxyReq, req, res, options) {
              req.params;
              res.status(200).send('OK');
            },
            proxyReqWs(proxyReq, req, socket, options, head) {
              req.params;
            },
            proxyRes(proxyRes, req, res) {
              req.params;
              res.status(200).send('OK');
            },
            close(proxyRes, proxySocket, proxyHead) {
              proxyRes.params;
            },
            start(req, res, target) {
              req.params;
              res.status(200).send('OK');
            },
            end(req, res, proxyRes) {
              req.params;
              res.status(200).send('OK');
              proxyRes.params;
            },
            econnreset(error, req, res, target) {
              req.params;
              res.status(200).send('OK');
            },
          },
        }),
      );

      expect(app).toBeDefined();
    });

    it('should get contextual types from express server', () => {
      const app = express();
      app.use(
        '/',
        // FIXME: contextual types should work with express path middleware (without providing explicit types)
        middleware<express.Request, express.Response>({
          router: (req) => req.params,
          pathFilter: (pathname, req) => !!req.params,
          on: {
            error(error, req, res, target) {
              req.params;

              // https://www.typescriptlang.org/docs/handbook/2/narrowing.html
              if (res instanceof http.ServerResponse) {
                res.status(200).send('OK');
              }
            },
            proxyReq(proxyReq, req, res, options) {
              req.params;
              res.status(200).send('OK');
            },
            proxyReqWs(proxyReq, req, socket, options, head) {
              req.params;
            },
            proxyRes(proxyRes, req, res) {
              req.params;
              res.status(200).send('OK');
            },
            close(proxyRes, proxySocket, proxyHead) {
              proxyRes.params;
            },
            start(req, res, target) {
              req.params;
              res.status(200).send('OK');
            },
            end(req, res, proxyRes) {
              req.params;
              res.status(200).send('OK');
              proxyRes.params;
            },
            econnreset(error, req, res, target) {
              req.params;
              res.status(200).send('OK');
            },
          },
        }),
      );

      expect(app).toBeDefined();
    });

    it('should work with explicit generic custom req & res types', () => {
      interface MyRequest extends http.IncomingMessage {
        myRequestParams: { [key: string]: string };
      }

      interface MyResponse extends http.ServerResponse {
        myResponseParams: { [key: string]: string };
      }

      const proxy: RequestHandler<MyRequest, MyResponse> = middleware({
        router: (req) => req.myRequestParams,
        pathFilter: (pathname, req) => !!req.myRequestParams,

        on: {
          error(error, req, res, target) {
            req.myRequestParams;

            // https://www.typescriptlang.org/docs/handbook/2/narrowing.html
            if (res instanceof http.ServerResponse) {
              res.myResponseParams;
            }
          },
          proxyReq(proxyReq, req, res, options) {
            req.myRequestParams;
            res.myResponseParams;
          },
          proxyReqWs(proxyReq, req, socket, options, head) {
            req.myRequestParams;
          },
          proxyRes(proxyRes, req, res) {
            req.myRequestParams;
            res.myResponseParams;
          },
          close(proxyRes, proxySocket, proxyHead) {
            proxyRes.myRequestParams;
          },
          start(req, res, target) {
            req.myRequestParams;
            res.myResponseParams;
          },
          end(req, res, proxyRes) {
            req.myRequestParams;
            res.myResponseParams;
            proxyRes.myRequestParams;
          },
          econnreset(error, req, res, target) {
            req.myRequestParams;
            res.myResponseParams;
          },
        },
      });

      expect(proxy).toBeDefined();
    });

    it('should work with custom req & res types in responseInterceptor', () => {
      interface MyRequest extends http.IncomingMessage {
        myRequestParams: { [key: string]: string };
      }

      interface MyResponse extends http.ServerResponse {
        myResponseParams: { [key: string]: string };
      }

      const proxy: RequestHandler<MyRequest, MyResponse> = middleware({
        target: 'http://www.example.org',
        on: {
          error: (err: Error & { code?: string }, req, res) => {
            err.code;
          },
          proxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
            req.myRequestParams;
            res.myResponseParams;
            return buffer;
          }),
        },
      });

      expect(proxy).toBeDefined();
    });

    it('should work with express.Request with fixRequestBody', () => {
      const proxy: RequestHandler<express.Request> = middleware({
        target: 'http://www.example.org',
        on: {
          proxyReq: fixRequestBody,
        },
      });

      expect(proxy).toBeDefined();
    });

    it('should work with generic types in plugins', () => {
      const proxy: RequestHandler<express.Request, express.Response> = middleware({
        target: 'http://www.example.org',
        plugins: [
          (proxyServer, options) => {
            proxyServer.on('proxyReq', (proxyReq, req, res, options) => {
              req.params;
              res.status(200).send('OK');
            });
          },
        ],
      });

      expect(proxy).toBeDefined();
    });

    it('should work with contextual Express types with shipped plugins', () => {
      const app = express();
      app.use(
        middleware({
          target: 'http://www.example.org',
          plugins: [
            (proxyServer, options) => {
              // fixRequestBody
              proxyServer.on('proxyReq', fixRequestBody);

              // responseInterceptor
              proxyServer.on(
                'proxyRes',
                responseInterceptor(async (buffer, proxyRes, req, res) => {
                  req.params;
                  res.status(200).send('OK');
                  return buffer;
                }),
              );
            },
          ],
        }),
      );

      expect(app).toBeDefined();
    });
  });
});
