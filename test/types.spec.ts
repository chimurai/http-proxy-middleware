/* eslint-disable @typescript-eslint/no-empty-function */

import * as express from 'express';
import * as http from 'http';
import { createProxyMiddleware as middleware } from '../src';
import type { Options } from '../src/types';

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

    it('should get express types from express server', () => {
      const app = express();
      app.use(
        middleware({
          // @ts-check
          router: (req) => req.params,
          // @ts-check
          pathFilter: (pathname, req) => !!req.params,

          // TODO: @types/http-proxy is missing generics
          // on: {
          //   proxyReq(proxyReq, req, res, options) {
          //     // @ts-check
          //     req.params;
          //   },
          //   proxyRes(proxyRes, req, res) {
          //     // @ts-check
          //     res.status(200).send('OK');
          //   },
          // },
        })
      );

      expect(app).toBeDefined();
    });
  });
});
