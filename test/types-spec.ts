import { createProxyMiddleware, createProxyMiddleware as middleware } from '../src';
import { Options } from '../src/types';
import * as http from 'http';
import * as express from 'express';
import * as connect from 'connect';
import * as browserSync from 'browser-sync';
/* tslint:disable:no-unused-expression because we're expecting expressions to compile */

describe('http-proxy-middleware TypeScript Types', () => {
  let options: Options;

  beforeEach(() => {
    options = {
      target: 'http://example.org',
    };
  });

  it('should create proxy with just options', () => {
    const proxy = middleware(options);
    expect(proxy).toBeDefined();
  });

  describe('HPM Filters', () => {
    it('should create proxy with path filter', () => {
      const proxy = middleware('/path', options);
      expect(proxy).toBeDefined();
    });

    it('should create proxy with glob filter', () => {
      const proxy = middleware(['/path/**'], options);
      expect(proxy).toBeDefined();
    });

    it('should create proxy with custom filter', () => {
      const proxy = middleware((path, req) => true, options);
      expect(proxy).toBeDefined();
    });

    it('should create proxy with manual websocket upgrade function', () => {
      const proxy = middleware((path, req) => true, options);
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

    describe('logLevel', () => {
      it('should have logLevel Type', () => {
        options = { logLevel: 'info' };
        expect(options).toBeDefined();
      });
    });

    describe('logProvider', () => {
      it('should have logProvider Type', () => {
        options = {
          logProvider: (currentProvider) => {
            return {
              log: () => {
                return;
              },
              debug: () => {
                return;
              },
              info: () => {
                return;
              },
              warn: () => {
                return;
              },
              error: () => {
                return;
              },
            };
          },
        };
        expect(options).toBeDefined();
      });
    });

    describe('HPM http-proxy events', () => {
      it('should have onError type', () => {
        // tslint:disable no-empty
        options = { onError: (err, req, res) => {} };
        expect(options).toBeDefined();
      });

      it('should have onProxyReq type', () => {
        // tslint:disable no-empty
        options = { onProxyReq: (proxyReq, req, res) => {} };
        expect(options).toBeDefined();
      });

      it('should have onProxyRes type', () => {
        // tslint:disable no-empty
        options = { onProxyRes: (proxyRes, req, res) => {} };
        expect(options).toBeDefined();
      });

      it('should have onProxyReqWs type', () => {
        options = {
          // tslint:disable no-empty
          onProxyReqWs: (proxyReq, req, socket, opts, head) => {},
        };
        expect(options).toBeDefined();
      });

      it('should have onOpen type', () => {
        // tslint:disable no-empty
        options = { onOpen: (proxySocket) => {} };
        expect(options).toBeDefined();
      });

      it('should have onClose type', () => {
        // tslint:disable no-empty
        options = { onClose: (res, socket, head) => {} };
        expect(options).toBeDefined();
      });
    });
  });

  describe('request response inference', () => {
    interface FooBarRequest extends http.IncomingMessage {
      foo: string;
    }
    interface FooBarResponse extends http.ServerResponse {
      bar: number;
    }
    const fooBarUse = (handler: (request: FooBarRequest, response: FooBarResponse) => void) => {};

    fooBarUse(createProxyMiddleware((_, request) => request.foo && true));
    fooBarUse(
      createProxyMiddleware({
        onError: (_, request, response) => {
          request.foo;
          response.bar;
          // @ts-expect-error
          request.params;
          // @ts-expect-error
          response.json;
        },
      })
    );
  });

  describe('works for third-party libraries', () => {
    express().use(
      '/proxy',
      createProxyMiddleware({
        onError: (_, request, response) => {
          request.params;
          response.json;
          // @ts-expect-error
          request.lol;
          // @ts-expect-error
          response.lol;
        },
      })
    );

    connect().use(
      '/proxy',
      createProxyMiddleware({
        onError: (_, request, response) => {
          // todo, non trivial fix @ts-expect-error
          request.params;
          /*
          problem with connect types,
          request somehow gets inferred to `any` because of `connect.ErrorHandleFunction`

          connect types are anyway pretty weird, like in `connect().use((req, res) => {})`,
          `req` and `req` get inferred to `any`
          */

          // @ts-expect-error
          response.json;
        },
      })
    );

    browserSync.create().init({
      server: {
        middleware: [
          createProxyMiddleware({
            onError: (_, request, response) => {
              // @ts-expect-error
              request.params;
              // @ts-expect-error
              response.json;
            },
          }),
        ],
      },
    });
  });
});
