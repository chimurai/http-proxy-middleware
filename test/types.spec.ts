/* eslint-disable @typescript-eslint/no-unused-expressions */
import * as http from 'node:http';
import type * as net from 'node:net';

import express from 'express';
import type { ProxyServerEventMap, ProxyServerOptions, ProxyTarget } from 'httpxy';
import { beforeEach, describe, expect, expectTypeOf, it } from 'vitest';

import {
  definePlugin,
  fixRequestBody,
  createProxyMiddleware as middleware,
  responseInterceptor,
} from '../src/index.js';
import type { Options, RequestHandler } from '../src/types.js';

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

    it('should create proxy with truthy filter', () => {
      const proxy = middleware({
        ...options,
        pathFilter: (path, req) => path.match('^/api') && req.method === 'GET',
      });
      expect(proxy).toBeDefined();
    });

    it('should create proxy with truthy regex match filter', () => {
      const proxy = middleware({ ...options, pathFilter: (path, req) => path.match('^/api') });
      expect(proxy).toBeDefined();
    });

    it('should create proxy with truthy regex test filter', () => {
      const proxy = middleware({ ...options, pathFilter: (path, req) => /^\/api/.test(path) });
      expect(proxy).toBeDefined();
    });

    it('should create proxy with manual websocket upgrade function', () => {
      const proxy = middleware({ ...options, pathFilter: (path, req) => true });
      expect(proxy.upgrade).toBeDefined();
    });
  });

  describe('`httpxy` options', () => {
    it('should extend from `httpxy` options', () => {
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
        options = {
          router: (req, res, options) => {
            options.headers = { ...options.headers, 'x-added-header': 'value' };
            return '/path';
          },
        };
        expect(options).toBeDefined();
      });

      it('should have router Type with async function', () => {
        options = {
          router: async (req, res, options) => {
            options.headers = { ...options.headers, 'x-added-header': 'value' };
            return '/path';
          },
        };
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
          pathRewrite: (path, req, res, options) => {
            req.params;

            // @ts-expect-error: should error when request is typed as `any`
            req.unknownProperty;

            // @ts-expect-error: should error when response is typed as `any`
            res?.unknownProperty;

            return path + (res?.locals ?? '');
          },
          on: {
            error(error, req, res, target) {
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
              req.params;
              res.status(200).send('OK');
            },
            proxyReqWs(proxyReq, req, socket, options, head) {
              req.params;
              head.byteLength;
            },
            proxyRes(proxyRes, req, res) {
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
              req.params;
              res.status(200).send('OK');
            },
            end(req, res, proxyRes) {
              req.params;
              res.status(200).send('OK');
              proxyRes.statusCode;
              // @ts-expect-error upstream response is not an Express request
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
              head.byteLength;
            },
            proxyRes(proxyRes, req, res) {
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
            },
            start(req, res, target) {
              req.params;
              res.status(200).send('OK');
            },
            end(req, res, proxyRes) {
              req.params;
              res.status(200).send('OK');
              proxyRes.statusCode;
              // @ts-expect-error upstream response is not an Express request
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
            proxyRes.statusCode;
            // @ts-expect-error upstream response does not have request properties
            proxyRes.myRequestParams;
            res.myResponseParams;
          },
          close(proxyRes, proxySocket, proxyHead) {
            proxyRes.statusCode;
            // @ts-expect-error upstream response does not have request properties
            proxyRes.myRequestParams;
            proxyHead.byteLength;
          },
          start(req, res, target) {
            req.myRequestParams;
            res.myResponseParams;
          },
          end(req, res, proxyRes) {
            req.myRequestParams;
            res.myResponseParams;
            proxyRes.statusCode;
            // @ts-expect-error upstream response does not have request properties
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

            // @ts-expect-error: should error when request is typed as `any`
            req.unknownProperty;
            // @ts-expect-error: should error when response is typed as `any`
            res.unknownProperty;
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

              // @ts-expect-error: should error when request is typed as `any`
              req.unknownProperty;
              // @ts-expect-error: should error when response is typed as `any`
              res.unknownProperty;

              res.status(200).send('OK');
            });
            proxyServer.on('proxyRes', (proxyRes, req, res) => {
              req.params;
              res.status(200).send('OK');
              proxyRes.statusCode;
              // @ts-expect-error upstream response is not an Express request
              proxyRes.params;
            });
            proxyServer.on('end', (req, res, proxyRes) => {
              req.params;
              res.status(200).send('OK');
              proxyRes.statusCode;
              // @ts-expect-error upstream response is not an Express request
              proxyRes.params;
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
        proxyServer.on('proxyReq', (proxyReq, req, res, options) => {
          req.url;
          res.statusCode;

          // @ts-expect-error: should error when request is typed as `any`
          req.unknownProperty;
          // @ts-expect-error: should error when response is typed as `any`
          res.unknownProperty;
        });
      });

      expect(myPlugin).toBeDefined();
    });

    it('should define plugin with custom req & res types', () => {
      interface MyRequest extends http.IncomingMessage {
        myRequestParams: { [key: string]: string };
      }

      interface MyResponse extends http.ServerResponse {
        myResponseParams: { [key: string]: string };
      }

      const myPlugin = definePlugin<MyRequest, MyResponse>((proxyServer, options) => {
        proxyServer.on('proxyReq', (proxyReq, req, res, options) => {
          req.myRequestParams;
          res.myResponseParams;

          // @ts-expect-error: should error when request is typed as `any`
          req.unknownProperty;
          // @ts-expect-error: should error when response is typed as `any`
          res.unknownProperty;
        });
      });

      expect(myPlugin).toBeDefined();
    });

    it('should inherit event types in plugins with custom request and response types', () => {
      interface MyRequest extends http.IncomingMessage {
        myRequestParams: { id: string };
      }

      interface MyResponse extends http.ServerResponse {
        myResponseParams: { id: string };
      }

      const myPlugin = definePlugin<MyRequest, MyResponse>((proxyServer) => {
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

      expect(myPlugin).toBeDefined();
    });
  });
});
