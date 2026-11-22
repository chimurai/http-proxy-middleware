/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as http from 'node:http';
import type * as net from 'node:net';

import express from 'express';
import type { ProxyServerEventMap, ProxyServerOptions, ProxyTarget, ProxyServer } from 'httpxy';
import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest';

import {
  definePlugin,
  fixRequestBody,
  createProxyMiddleware as middleware,
  responseInterceptor,
} from '../src/index.js';
import type { Options, Plugin, RequestHandler } from '../src/types.js';

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
      expectTypeOf(proxy).toEqualTypeOf<RequestHandler>();
      expectTypeOf(proxy.upgrade).toEqualTypeOf<RequestHandler['upgrade']>();
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
      expectTypeOf(proxy).toEqualTypeOf<RequestHandler>();
    });

    it('should create proxy with glob filter', () => {
      const proxy = middleware({ ...options, pathFilter: ['/path/**'] });
      expectTypeOf(proxy).toEqualTypeOf<RequestHandler>();
    });

    it('should create proxy with custom filter', () => {
      const proxy = middleware({
        ...options,
        pathFilter: (path, req) => {
          expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
          return true;
        },
      });
      expectTypeOf(proxy).toEqualTypeOf<RequestHandler>();
    });

    it('should create proxy with truthy filter', () => {
      const proxy = middleware({
        ...options,
        pathFilter: (path, req) => {
          expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
          return path.match('^/api') && req.method === 'GET';
        },
      });
      expectTypeOf(proxy).toEqualTypeOf<RequestHandler>();
    });

    it('should create proxy with truthy regex match filter', () => {
      const proxy = middleware({
        ...options,
        pathFilter: (path, req) => {
          expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
          return path.match('^/api');
        },
      });
      expectTypeOf(proxy).toEqualTypeOf<RequestHandler>();
    });

    it('should create proxy with truthy regex test filter', () => {
      const proxy = middleware({
        ...options,
        pathFilter: (path, req) => {
          expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
          return /^\/api/.test(path);
        },
      });
      expectTypeOf(proxy).toEqualTypeOf<RequestHandler>();
    });

    it('should create proxy with manual websocket upgrade function', () => {
      const proxy = middleware({
        ...options,
        pathFilter: (path, req) => {
          expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
          return true;
        },
      });
      expectTypeOf(proxy.upgrade).toEqualTypeOf<RequestHandler['upgrade']>();
    });
  });

  describe('`httpxy` options', () => {
    it('should extend from `httpxy` options', () => {
      options = {
        target: 'http://example',
        ws: true,
      };
      expectTypeOf(options).toEqualTypeOf<Options>();
    });
  });

  describe('http-proxy-middleware options', () => {
    describe('pathRewrite', () => {
      it('should have pathRewrite Type with table', () => {
        options = { pathRewrite: { '^/from': '/to' } };
        expectTypeOf(options).toEqualTypeOf<Options>();
      });

      it('should have pathRewrite Type with function', () => {
        options = {
          pathRewrite: (path, req, res) => {
            expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
            expectTypeOf(res).toEqualTypeOf<http.ServerResponse | undefined>();
            return '/path';
          },
        };
        expectTypeOf(options).toEqualTypeOf<Options>();
      });

      it('should have pathRewrite Type with async function', () => {
        options = {
          pathRewrite: async (path, req, res) => {
            expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
            expectTypeOf(res).toEqualTypeOf<http.ServerResponse | undefined>();
            return '/path';
          },
        };
        expectTypeOf(options).toEqualTypeOf<Options>();
      });
    });

    describe('router', () => {
      it('should have router Type with table', () => {
        options = { router: { '^/from': '/to' } };
        expectTypeOf(options).toEqualTypeOf<Options>();
      });

      it('should have router Type with function', () => {
        options = {
          router: (req, res, options) => {
            expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
            expectTypeOf(res).toEqualTypeOf<http.ServerResponse | undefined>();
            options.headers = { ...options.headers, 'x-added-header': 'value' };
            return '/path';
          },
        };
        expectTypeOf(options).toEqualTypeOf<Options>();
      });

      it('should have router Type with async function', () => {
        options = {
          router: async (req, res, options) => {
            expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
            expectTypeOf(res).toEqualTypeOf<http.ServerResponse | undefined>();
            options.headers = { ...options.headers, 'x-added-header': 'value' };
            return '/path';
          },
        };
        expectTypeOf(options).toEqualTypeOf<Options>();
      });
    });

    describe('logger', () => {
      it('should have logger option', () => {
        options = { logger: console };
        expectTypeOf(options).toEqualTypeOf<Options>();
      });

      it('should allow custom logger option', () => {
        const customLogger = {
          info: () => {},
          warn: () => {},
          error: () => {},
        };
        options = { logger: customLogger };
        expectTypeOf(options).toEqualTypeOf<Options>();
      });

      it('should fail when custom logger has missing log function', () => {
        const customLogger = {
          info: () => {},
          // warn: () => {},
          error: () => {},
        };
        // @ts-expect-error explanation: should error when customLogger has a missing log function
        options = { logger: customLogger };
        expectTypeOf(options).toEqualTypeOf<Options>();
      });

      it('should fail when invalid logger is provided', () => {
        // @ts-expect-error explanation: should error when invalid logger is provided
        options = { logger: 500 };
        expectTypeOf(options).toEqualTypeOf<Options>();
      });
    });

    describe('on', () => {
      it('should have on events', () => {
        options = {
          on: {
            error: (error, req, res, target) => {
              expectTypeOf(error).toEqualTypeOf<Error>();
              expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
              expectTypeOf(res).toEqualTypeOf<http.ServerResponse | net.Socket>();
              expectTypeOf(target).toEqualTypeOf<ProxyTarget | undefined>();
            },
            proxyReq: (proxyReq, req, res, options) => {
              expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
              expectTypeOf(res).toEqualTypeOf<http.ServerResponse>();
              expectTypeOf(options).toEqualTypeOf<ProxyServerOptions>();
            },
            proxyReqWs: (proxyReq, req, socket, options) => {
              expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
              expectTypeOf(options).toEqualTypeOf<ProxyServerOptions>();
            },
            proxyRes: (proxyRes, req, res) => {
              expectTypeOf(proxyRes).toEqualTypeOf<http.IncomingMessage>();
              expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
              expectTypeOf(res).toEqualTypeOf<http.ServerResponse>();
            },
            open: (proxySocket) => {},
            close: (proxyRes, proxySocket, proxyHead) => {
              expectTypeOf(proxyRes).toEqualTypeOf<http.IncomingMessage>();
            },
            start: (req, res, target) => {
              expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
              expectTypeOf(res).toEqualTypeOf<http.ServerResponse>();
              expectTypeOf(target).toEqualTypeOf<ProxyTarget>();
            },
            end: (req, res, proxyRes) => {
              expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
              expectTypeOf(res).toEqualTypeOf<http.ServerResponse>();
              expectTypeOf(proxyRes).toEqualTypeOf<http.IncomingMessage>();
            },
            econnreset: (error, req, res, target) => {
              expectTypeOf(error).toEqualTypeOf<Error>();
              expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
              expectTypeOf(res).toEqualTypeOf<http.ServerResponse>();
              expectTypeOf(target).toEqualTypeOf<ProxyTarget>();
            },

            // @ts-expect-error explanation: should error when unknown event is passed
            unknownEventName: () => {},
          },
        };
        expectTypeOf(options).toEqualTypeOf<Options>();
      });
    });
  });

  describe('express request and response types', () => {
    it('should get TypeScript type errors when express specific properties are used with base types', () => {
      options = {
        on: {
          proxyReq(proxyReq, req, res, options) {
            expectTypeOf(proxyReq).toEqualTypeOf<http.ClientRequest>();
            expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
            expectTypeOf(res).toEqualTypeOf<http.ServerResponse>();
            expectTypeOf(options).toEqualTypeOf<ProxyServerOptions>();
            // @ts-expect-error explanation: should error when express properties are used
            req.params;
          },
          proxyRes(proxyRes, req, res) {
            expectTypeOf(proxyRes).toEqualTypeOf<http.IncomingMessage>();
            expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
            expectTypeOf(res).toEqualTypeOf<http.ServerResponse>();
            // @ts-expect-error explanation: should error when express properties are used
            res.status(200).send('OK');
          },
        },
      };

      expectTypeOf(options).toEqualTypeOf<Options>();
    });

    it('should get contextual types from express server', () => {
      const app = express();
      app.use(
        middleware({
          router: (req, res) => {
            expectTypeOf(req).toEqualTypeOf<express.Request>();
            expectTypeOf(res).toEqualTypeOf<express.Response | undefined>();
            return req.params;
          },
          pathFilter: (pathname, req) => {
            expectTypeOf(req).toEqualTypeOf<express.Request>();
            return !!req.params;
          },
          pathRewrite: (path, req, res, options) => {
            expectTypeOf(req).toEqualTypeOf<express.Request>();
            expectTypeOf(res).toEqualTypeOf<express.Response | undefined>();
            req.params;

            // @ts-expect-error: should error when request is typed as `any`
            req.unknownProperty;

            // @ts-expect-error: should error when response is typed as `any`
            res?.unknownProperty;

            return path + (res?.locals ?? '');
          },
          on: {
            error(error, req, res, target) {
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response | net.Socket>();
              req.params;

              // @ts-expect-error: should error when request is typed as `any`
              req.unknownProperty;
              // @ts-expect-error: should error when response is typed as `any`
              res.unknownProperty;

              // https://www.typescriptlang.org/docs/handbook/2/narrowing.html
              if (res instanceof http.ServerResponse) {
                res.status(200).send('OK');
              }
            },
            proxyReq(proxyReq, req, res, options) {
              expectTypeOf(proxyReq).toEqualTypeOf<http.ClientRequest>();
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response>();
              expectTypeOf(options).toEqualTypeOf<ProxyServerOptions>();
              req.params;
              res.status(200).send('OK');
            },
            proxyReqWs(proxyReq, req, socket, options, head) {
              expectTypeOf(proxyReq).toEqualTypeOf<http.ClientRequest>();
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(options).toEqualTypeOf<ProxyServerOptions>();
              req.params;
              head.byteLength;
            },
            proxyRes(proxyRes, req, res) {
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response>();
              req.params;
              proxyRes.statusCode;
              // @ts-expect-error upstream response is not an Express request
              proxyRes.params;

              res.status(200).send('OK');
            },
            close(proxyRes, proxySocket, proxyHead) {
              proxyRes.statusCode;
              // @ts-expect-error upstream response is not an Express request
              proxyRes.params;
              proxyHead.byteLength;

              // @ts-expect-error explanation: websocket head should be a Buffer
              proxyHead.params;
            },
            start(req, res, target) {
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response>();
              expectTypeOf(target).toEqualTypeOf<ProxyTarget>();
              req.params;
              res.status(200).send('OK');
            },
            end(req, res, proxyRes) {
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response>();
              req.params;
              res.status(200).send('OK');
              proxyRes.statusCode;
              // @ts-expect-error upstream response is not an Express request
              proxyRes.params;
            },
            econnreset(error, req, res, target) {
              expectTypeOf(error).toEqualTypeOf<Error>();
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response>();
              expectTypeOf(target).toEqualTypeOf<ProxyTarget>();
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
          router: (req, res) => {
            expectTypeOf(req).toEqualTypeOf<express.Request>();
            expectTypeOf(res).toEqualTypeOf<express.Response | undefined>();
            return req.params;
          },
          pathFilter: (pathname, req) => {
            expectTypeOf(req).toEqualTypeOf<express.Request>();
            return !!req.params;
          },
          on: {
            error(error, req, res, target) {
              expectTypeOf(error).toEqualTypeOf<Error>();
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response | net.Socket>();
              expectTypeOf(target).toEqualTypeOf<ProxyTarget | undefined>();
              req.params;

              // https://www.typescriptlang.org/docs/handbook/2/narrowing.html
              if (res instanceof http.ServerResponse) {
                res.status(200).send('OK');
              }
            },
            proxyReq(proxyReq, req, res, options) {
              expectTypeOf(proxyReq).toEqualTypeOf<http.ClientRequest>();
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response>();
              expectTypeOf(options).toEqualTypeOf<ProxyServerOptions>();
              req.params;
              res.status(200).send('OK');
            },
            proxyReqWs(proxyReq, req, socket, options, head) {
              expectTypeOf(proxyReq).toEqualTypeOf<http.ClientRequest>();
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(socket).toEqualTypeOf<net.Socket>();
              expectTypeOf(options).toEqualTypeOf<ProxyServerOptions>();
              req.params;
              head.byteLength;
            },
            proxyRes(proxyRes, req, res) {
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response>();
              req.params;

              proxyRes.statusCode;
              // @ts-expect-error upstream response is not an Express request
              proxyRes.params;

              res.status(200).send('OK');
            },
            close(proxyRes, proxySocket, proxyHead) {
              expectTypeOf(proxyRes).toEqualTypeOf<http.IncomingMessage>();
              expectTypeOf(proxySocket).toEqualTypeOf<net.Socket>();
              expectTypeOf(proxyHead).toEqualTypeOf<Buffer>();
              proxyRes.statusCode;
              // @ts-expect-error upstream response is not an Express request
              proxyRes.params;
              proxyHead.byteLength;
            },
            start(req, res, target) {
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response>();
              expectTypeOf(target).toEqualTypeOf<ProxyTarget>();
              req.params;
              res.status(200).send('OK');
            },
            end(req, res, proxyRes) {
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response>();
              req.params;
              res.status(200).send('OK');
              proxyRes.statusCode;
              // @ts-expect-error upstream response is not an Express request
              proxyRes.params;
            },
            econnreset(error, req, res, target) {
              expectTypeOf(error).toEqualTypeOf<Error>();
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response>();
              expectTypeOf(target).toEqualTypeOf<ProxyTarget>();
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
        router: (req, res, options) => {
          expectTypeOf(req).toEqualTypeOf<MyRequest>();
          expectTypeOf(res).toEqualTypeOf<MyResponse | undefined>();
          expectTypeOf(options).toEqualTypeOf<Options<MyRequest, MyResponse>>();
          return '/path';
        },
        pathFilter: (pathname, req) => {
          expectTypeOf(req).toEqualTypeOf<MyRequest>();
          return !!req.myRequestParams;
        },
        pathRewrite: (path, req, res, options) => {
          expectTypeOf(req).toEqualTypeOf<MyRequest>();
          expectTypeOf(res).toEqualTypeOf<MyResponse | undefined>();
          expectTypeOf(options).toEqualTypeOf<Options<MyRequest, MyResponse> | undefined>();
          return path;
        },

        on: {
          error(error, req, res, target) {
            expectTypeOf(error).toEqualTypeOf<Error>();
            expectTypeOf(req).toEqualTypeOf<MyRequest>();
            expectTypeOf(res).toEqualTypeOf<MyResponse | net.Socket>();
            expectTypeOf(target).toEqualTypeOf<ProxyTarget | undefined>();
            req.myRequestParams;

            // https://www.typescriptlang.org/docs/handbook/2/narrowing.html
            if (res instanceof http.ServerResponse) {
              res.myResponseParams;
            }
          },
          proxyReq(proxyReq, req, res, options) {
            expectTypeOf(proxyReq).toEqualTypeOf<http.ClientRequest>();
            expectTypeOf(req).toEqualTypeOf<MyRequest>();
            expectTypeOf(res).toEqualTypeOf<MyResponse>();
            expectTypeOf(options).toEqualTypeOf<ProxyServerOptions>();
            req.myRequestParams;
            res.myResponseParams;
          },
          proxyReqWs(proxyReq, req, socket, options, head) {
            expectTypeOf(proxyReq).toEqualTypeOf<http.ClientRequest>();
            expectTypeOf(req).toEqualTypeOf<MyRequest>();
            expectTypeOf(socket).toEqualTypeOf<net.Socket>();
            expectTypeOf(options).toEqualTypeOf<ProxyServerOptions>();
            expectTypeOf(head).toEqualTypeOf<Buffer>();
            req.myRequestParams;
          },
          proxyRes(proxyRes, req, res) {
            expectTypeOf(req).toEqualTypeOf<MyRequest>();
            expectTypeOf(res).toEqualTypeOf<MyResponse>();

            req.myRequestParams;
            proxyRes.statusCode;
            // @ts-expect-error upstream response does not have request properties
            proxyRes.myRequestParams;
            res.myResponseParams;
          },
          close(proxyRes, proxySocket, proxyHead) {
            expectTypeOf(proxyRes).toEqualTypeOf<http.IncomingMessage>();
            proxyRes.statusCode;
            // @ts-expect-error upstream response does not have request properties
            proxyRes.myRequestParams;
            expectTypeOf(proxyHead).toEqualTypeOf<Buffer>();
            proxyHead.byteLength;
          },
          start(req, res, target) {
            expectTypeOf(req).toEqualTypeOf<MyRequest>();
            expectTypeOf(res).toEqualTypeOf<MyResponse>();
            expectTypeOf(target).toEqualTypeOf<ProxyTarget>();
            req.myRequestParams;
            res.myResponseParams;
          },
          end(req, res, proxyRes) {
            expectTypeOf(req).toEqualTypeOf<MyRequest>();
            expectTypeOf(res).toEqualTypeOf<MyResponse>();
            req.myRequestParams;
            res.myResponseParams;
            proxyRes.statusCode;
            // @ts-expect-error upstream response does not have request properties
            proxyRes.myRequestParams;
          },
          econnreset(error, req, res, target) {
            expectTypeOf(error).toEqualTypeOf<Error>();
            expectTypeOf(req).toEqualTypeOf<MyRequest>();
            expectTypeOf(res).toEqualTypeOf<MyResponse>();
            expectTypeOf(target).toEqualTypeOf<ProxyTarget>();
            req.myRequestParams;
            res.myResponseParams;
          },
        },
      });

      expectTypeOf(proxy).toEqualTypeOf<RequestHandler<MyRequest, MyResponse>>();
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
            expectTypeOf(req).toEqualTypeOf<MyRequest>();
            expectTypeOf(res).toEqualTypeOf<MyResponse | net.Socket>();
            err.code;
          },
          proxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
            expectTypeOf(buffer).toEqualTypeOf<Buffer>();
            expectTypeOf(proxyRes).toEqualTypeOf<http.IncomingMessage>();
            expectTypeOf(req).toEqualTypeOf<MyRequest>();
            expectTypeOf(res).toEqualTypeOf<MyResponse>();
            req.myRequestParams;
            res.myResponseParams;

            // @ts-expect-error: should error when request is typed as `any`
            req.unknownProperty;
            // @ts-expect-error: should error when response is typed as `any`
            res.unknownProperty;
            return buffer;
          }),
        },
      });

      expectTypeOf(proxy).toEqualTypeOf<RequestHandler<MyRequest, MyResponse>>();
    });

    it('should work with express.Request with fixRequestBody', () => {
      const proxy: RequestHandler<express.Request> = middleware({
        target: 'http://www.example.org',
        on: {
          proxyReq: fixRequestBody,
        },
      });

      expectTypeOf(proxy).toEqualTypeOf<RequestHandler<express.Request>>();
    });

    it('should work with generic types in plugins', () => {
      const proxy: RequestHandler<express.Request, express.Response> = middleware({
        target: 'http://www.example.org',
        plugins: [
          (proxyServer, options) => {
            expectTypeOf(proxyServer).toEqualTypeOf<
              ProxyServer<express.Request, express.Response>
            >();
            expectTypeOf(options).toEqualTypeOf<Options<express.Request, express.Response>>();

            proxyServer.on('proxyReq', (proxyReq, req, res, options) => {
              expectTypeOf(proxyReq).toEqualTypeOf<http.ClientRequest>();
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response>();
              expectTypeOf(options).toEqualTypeOf<ProxyServerOptions>();
              req.params;

              // @ts-expect-error: should error when request is typed as `any`
              req.unknownProperty;
              // @ts-expect-error: should error when response is typed as `any`
              res.unknownProperty;

              res.status(200).send('OK');
            });
            proxyServer.on('proxyRes', (proxyRes, req, res) => {
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response>();
              req.params;
              res.status(200).send('OK');
              proxyRes.statusCode;
              // @ts-expect-error upstream response is not an Express request
              proxyRes.params;
            });
            proxyServer.on('end', (req, res, proxyRes) => {
              expectTypeOf(req).toEqualTypeOf<express.Request>();
              expectTypeOf(res).toEqualTypeOf<express.Response>();
              req.params;
              res.status(200).send('OK');
              proxyRes.statusCode;
              // @ts-expect-error upstream response is not an Express request
              proxyRes.params;
            });
          },
        ],
      });

      expectTypeOf(proxy).toEqualTypeOf<RequestHandler<express.Request, express.Response>>();
    });

    it('should work with contextual Express types with shipped plugins', () => {
      const app = express();
      app.use(
        middleware({
          target: 'http://www.example.org',
          plugins: [
            (proxyServer, options) => {
              expectTypeOf(proxyServer).toEqualTypeOf<
                ProxyServer<express.Request, express.Response>
              >();
              expectTypeOf(options).toEqualTypeOf<Options<express.Request, express.Response>>();

              // fixRequestBody
              proxyServer.on('proxyReq', fixRequestBody);

              // responseInterceptor
              proxyServer.on(
                'proxyRes',
                responseInterceptor(async (buffer, proxyRes, req, res) => {
                  expectTypeOf(buffer).toEqualTypeOf<Buffer>();
                  expectTypeOf(proxyRes).toEqualTypeOf<http.IncomingMessage>();
                  expectTypeOf(req).toEqualTypeOf<express.Request>();
                  expectTypeOf(res).toEqualTypeOf<express.Response>();
                  req.params;
                  res.status(200).send('OK');

                  // @ts-expect-error: should error when request is typed as `any`
                  req.unknownProperty;
                  // @ts-expect-error: should error when response is typed as `any`
                  res.unknownProperty;

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

  describe('definePlugin()', () => {
    it('should define plugin with correct types', () => {
      const myPlugin = definePlugin((proxyServer, options) => {
        expectTypeOf(proxyServer).toEqualTypeOf<
          ProxyServer<http.IncomingMessage, http.ServerResponse>
        >();
        expectTypeOf(options).toEqualTypeOf<Options<http.IncomingMessage, http.ServerResponse>>();

        proxyServer.on('proxyReq', (proxyReq, req, res, options) => {
          expectTypeOf(proxyReq).toEqualTypeOf<http.ClientRequest>();
          expectTypeOf(req).toEqualTypeOf<http.IncomingMessage>();
          expectTypeOf(res).toEqualTypeOf<http.ServerResponse>();
          expectTypeOf(options).toEqualTypeOf<ProxyServerOptions>();

          req.url;
          res.statusCode;

          // @ts-expect-error: should error when request is typed as `any`
          req.unknownProperty;
          // @ts-expect-error: should error when response is typed as `any`
          res.unknownProperty;
        });
      });

      expectTypeOf(myPlugin).toEqualTypeOf<Plugin>();
    });

    it('should define plugin with custom req & res types', () => {
      interface MyRequest extends http.IncomingMessage {
        myRequestParams: { [key: string]: string };
      }

      interface MyResponse extends http.ServerResponse {
        myResponseParams: { [key: string]: string };
      }

      const myPlugin = definePlugin<MyRequest, MyResponse>((proxyServer, options) => {
        expectTypeOf(proxyServer).toEqualTypeOf<ProxyServer<MyRequest, MyResponse>>();
        expectTypeOf(options).toEqualTypeOf<Options<MyRequest, MyResponse>>();

        proxyServer.on('proxyReq', (proxyReq, req, res, options) => {
          expectTypeOf(proxyReq).toEqualTypeOf<http.ClientRequest>();
          expectTypeOf(req).toEqualTypeOf<MyRequest>();
          expectTypeOf(res).toEqualTypeOf<MyResponse>();
          expectTypeOf(options).toEqualTypeOf<ProxyServerOptions>();

          req.myRequestParams;
          res.myResponseParams;

          // @ts-expect-error: should error when request is typed as `any`
          req.unknownProperty;
          // @ts-expect-error: should error when response is typed as `any`
          res.unknownProperty;
        });
      });

      expectTypeOf(myPlugin).toEqualTypeOf<Plugin<MyRequest, MyResponse>>();
    });

    it('should inherit event types in plugins with custom request and response types', () => {
      interface MyRequest extends http.IncomingMessage {
        myRequestParams: { id: string };
      }

      interface MyResponse extends http.ServerResponse {
        myResponseParams: { id: string };
      }

      const myPlugin = definePlugin<MyRequest, MyResponse>((proxyServer, options) => {
        expectTypeOf(proxyServer).toEqualTypeOf<ProxyServer<MyRequest, MyResponse>>();
        expectTypeOf(options).toEqualTypeOf<Options<MyRequest, MyResponse>>();

        proxyServer.on('error', (error, req, res, target) => {
          expectTypeOf(error).toEqualTypeOf<Error>();
          expectTypeOf(req).toEqualTypeOf<MyRequest | undefined>();
          expectTypeOf(res).toEqualTypeOf<MyResponse | net.Socket | undefined>();
          expectTypeOf(target).toEqualTypeOf<ProxyTarget | undefined>();
        });

        proxyServer.on('proxyReq', (proxyReq, req, res, options) => {
          expectTypeOf(proxyReq).toEqualTypeOf<http.ClientRequest>();
          expectTypeOf(req).toEqualTypeOf<MyRequest>();
          expectTypeOf(res).toEqualTypeOf<MyResponse>();
          expectTypeOf(options).toEqualTypeOf<ProxyServerOptions>();
        });

        proxyServer.on('proxyReqWs', (proxyReq, req, socket, options, head) => {
          expectTypeOf(proxyReq).toEqualTypeOf<http.ClientRequest>();
          expectTypeOf(req).toEqualTypeOf<MyRequest>();
          expectTypeOf(socket).toEqualTypeOf<net.Socket>();
          expectTypeOf(options).toEqualTypeOf<ProxyServerOptions>();
          expectTypeOf(head).toEqualTypeOf<
            ProxyServerEventMap<MyRequest, MyResponse>['proxyReqWs'][4]
          >();
        });

        proxyServer.on('proxyRes', (proxyRes, req, res) => {
          expectTypeOf(proxyRes).toEqualTypeOf<http.IncomingMessage>();
          expectTypeOf(req).toEqualTypeOf<MyRequest>();
          expectTypeOf(res).toEqualTypeOf<MyResponse>();
          // @ts-expect-error upstream response does not have request properties
          proxyRes.myRequestParams;
        });

        proxyServer.on('open', (socket) => {
          expectTypeOf(socket).toEqualTypeOf<net.Socket>();
        });

        proxyServer.on('close', (proxyRes, socket, head) => {
          // FIXME: httpxy types the upstream response as the incoming request.
          expectTypeOf(proxyRes).toEqualTypeOf<
            ProxyServerEventMap<MyRequest, MyResponse>['close'][0]
          >();
          expectTypeOf(socket).toEqualTypeOf<net.Socket>();
          expectTypeOf(head).toEqualTypeOf<
            ProxyServerEventMap<MyRequest, MyResponse>['close'][2]
          >();
        });

        proxyServer.on('start', (req, res, target) => {
          expectTypeOf(req).toEqualTypeOf<MyRequest>();
          expectTypeOf(res).toEqualTypeOf<MyResponse>();
          expectTypeOf(target).toEqualTypeOf<ProxyTarget>();
        });

        proxyServer.on('end', (req, res, proxyRes) => {
          expectTypeOf(req).toEqualTypeOf<MyRequest>();
          expectTypeOf(res).toEqualTypeOf<MyResponse>();
          expectTypeOf(proxyRes).toEqualTypeOf<http.IncomingMessage>();
          // @ts-expect-error upstream response does not have request properties
          proxyRes.myRequestParams;
        });

        proxyServer.on('econnreset', (error, req, res, target) => {
          expectTypeOf(error).toEqualTypeOf<Error>();
          expectTypeOf(req).toEqualTypeOf<MyRequest>();
          expectTypeOf(res).toEqualTypeOf<MyResponse>();
          expectTypeOf(target).toEqualTypeOf<ProxyTarget>();
        });
      });

      expectTypeOf(myPlugin).toEqualTypeOf<Plugin<MyRequest, MyResponse>>();
    });
  });
});
