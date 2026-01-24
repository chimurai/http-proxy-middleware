import type * as http from 'node:http';

import * as bodyParser from 'body-parser';
import type * as express from 'express';
import { CompletedRequest, Mockttp, getLocal } from 'mockttp';
import * as request from 'supertest';

import type { Logger } from '../../src/types';
import { createApp, createAppWithPath, createProxyMiddleware, fixRequestBody } from './test-kit';

describe('E2E http-proxy-middleware', () => {
  describe('http-proxy-middleware creation', () => {
    it('should create a middleware', () => {
      const middleware = createProxyMiddleware({
        target: `http://localhost:8000`,
        pathFilter: '/api',
      });
      expect(typeof middleware).toBe('function');
    });
  });

  describe('pathFilter matching', () => {
    describe('do not proxy', () => {
      const mockReq: http.IncomingMessage = {
        url: '/foo/bar',
      } as http.IncomingMessage;
      const mockRes: http.ServerResponse = {} as http.ServerResponse;
      const mockNext: express.NextFunction = jest.fn();

      beforeEach(() => {
        const middleware = createProxyMiddleware({
          target: `http://localhost:8000`,
          pathFilter: '/api',
        });

        middleware(mockReq, mockRes, mockNext);
      });

      it('should not proxy requests when request url does not match pathFilter', () => {
        expect(mockNext).toHaveBeenCalled();
      });
    });
  });

  describe('http-proxy-middleware in actual server', () => {
    let mockTargetServer: Mockttp;
    let agent: request.Agent;

    beforeEach(async () => {
      mockTargetServer = getLocal();
      await mockTargetServer.start();
    });

    afterEach(async () => {
      await mockTargetServer.stop();
    });

    describe('basic setup, requests to target', () => {
      beforeEach(() => {
        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: '/api',
            }),
          ),
        );
      });

      it('should have response body: "HELLO WEB"', async () => {
        await mockTargetServer.forGet('/api').thenReply(200, 'HELLO WEB');
        const response = await agent.get(`/api`).expect(200);
        expect(response.text).toBe('HELLO WEB');
      });

      it('should have proxied the uri-path and uri-query, but not the uri-hash', async () => {
        await mockTargetServer
          .forGet('/api/b/c/dp')
          .withExactQuery('?q=1&r=[2,3]')
          .thenReply(200, 'OK');

        const response = await request(`http://localhost:${mockTargetServer.port}`)
          .get(`/api/b/c/dp?q=1&r=[2,3]#s`)
          .expect(200);

        expect(response.text).toBe('OK');
      });
    });

    describe('basic setup with configured body-parser', () => {
      it('should proxy request body from form', async () => {
        agent = request(
          createApp(
            bodyParser.urlencoded({ extended: false }),
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: '/api',
              on: {
                proxyReq: fixRequestBody,
              },
            }),
          ),
        );

        await mockTargetServer.forPost('/api').thenCallback(async (req) => {
          expect(await req.body.getText()).toBe('foo=bar&bar=baz');
          return { statusCode: 200 };
        });
        await agent.post('/api').send('foo=bar').send('bar=baz').expect(200);
      });

      it('should proxy request body from json', async () => {
        agent = request(
          createApp(
            bodyParser.json(),
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: '/api',
              on: {
                proxyReq: fixRequestBody,
              },
            }),
          ),
        );

        await mockTargetServer.forPost('/api').thenCallback(async (req) => {
          expect(await req.body.getJson()).toEqual({ foo: 'bar', bar: 'baz', doubleByte: '文' });
          return { statusCode: 200 };
        });
        await agent.post('/api').send({ foo: 'bar', bar: 'baz', doubleByte: '文' }).expect(200);
      });
    });

    describe('custom pathFilter matcher/filter', () => {
      it('should have response body: "HELLO WEB"', async () => {
        const filter = (path: string, req: http.IncomingMessage) => {
          return true;
        };

        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: filter,
            }),
          ),
        );

        await mockTargetServer.forGet('/api/b/c/d').thenReply(200, 'HELLO WEB');
        const response = await agent.get(`/api/b/c/d`).expect(200);
        expect(response.text).toBe('HELLO WEB');
      });

      it('should not proxy when filter returns false', async () => {
        const filter = (path: string, req: http.IncomingMessage) => {
          return false;
        };

        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: filter,
            }),
          ),
        );

        await mockTargetServer.forGet('/api/b/c/d').thenReply(200, 'HELLO WEB');
        const response = await agent.get(`/api/b/c/d`).expect(404);
        expect(response.status).toBe(404);
      });

      it('should not proxy when filter throws Error', async () => {
        const myError = new Error('MY_ERROR');
        const filter = (path: string, req: http.IncomingMessage) => {
          throw myError;
        };

        const logger: Logger = {
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn(),
        };

        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: filter,
              logger: logger,
            }),
          ),
        );

        await mockTargetServer.forGet('/api/b/c/d').thenReply(200, 'HELLO WEB');
        const response = await agent.get(`/api/b/c/d`).expect(404);
        expect(response.status).toBe(404);
        expect(logger.error).toHaveBeenCalledWith(myError);
      });
    });

    describe('multi path', () => {
      beforeEach(() => {
        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: ['/api', '/ajax'],
            }),
          ),
        );
      });

      it('should proxy to path /api', async () => {
        await mockTargetServer.forGet(/\/api\/.+/).thenReply(200, 'HELLO /API');
        const response = await agent.get(`/api/b/c/d`).expect(200);
        expect(response.text).toBe('HELLO /API');
      });

      it('should proxy to path /ajax', async () => {
        await mockTargetServer.forGet(/\/ajax\/.+/).thenReply(200, 'HELLO /AJAX');
        const response = await agent.get(`/ajax/b/c/d`).expect(200);
        expect(response.text).toBe('HELLO /AJAX');
      });

      it('should not proxy with no matching path', async () => {
        const response = await agent.get(`/lorum/ipsum`).expect(404);
        expect(response.status).toBe(404);
      });
    });

    describe('wildcard path matching', () => {
      beforeEach(() => {
        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: '/api/**',
            }),
          ),
        );
      });

      it('should proxy to path', async () => {
        await mockTargetServer.forGet(/\/api\/.+/).thenReply(200, 'HELLO /api');
        const response = await agent.get(`/api/b/c/d`).expect(200);
        expect(response.text).toBe('HELLO /api');
      });
    });

    describe('multi glob wildcard path matching', () => {
      beforeEach(() => {
        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: ['**/*.html', '!**.json'],
            }),
          ),
        );
      });

      it('should proxy to paths ending with *.html', async () => {
        await mockTargetServer.forGet(/.+html$/).thenReply(200, 'HELLO .html');
        const response = await agent.get(`/api/some/endpoint/index.html`).expect(200);
        expect(response.text).toBe('HELLO .html');
      });

      it('should not proxy to paths ending with *.json', async () => {
        await mockTargetServer.forGet(/.+json$/).thenReply(200, 'HELLO .html');
        const response = await agent.get(`/api/some/endpoint/data.json`).expect(404);
        expect(response.status).toBe(404);
      });
    });

    describe('option.headers - additional request headers', () => {
      beforeEach(() => {
        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: '/api',
              headers: { host: 'foobar.dev' },
            }),
          ),
        );
      });

      it('should send request header "host" to target server', async () => {
        let completedRequest: CompletedRequest | undefined;

        await mockTargetServer.forGet().thenCallback((req) => {
          completedRequest = req;
          return { statusCode: 200, body: 'OK' };
        });

        const response = await agent.get(`/api/some/endpoint/index.html`).expect(200);
        expect(response.text).toBe('OK');
        expect(completedRequest?.headers.host).toBe('foobar.dev');
      });
    });

    describe('default httpProxy on error handling', () => {
      beforeEach(() => {
        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:666`, // unreachable host on port:666
            }),
          ),
        );
      });

      it('should handle errors when host is not reachable', async () => {
        const response = await agent.get(`/api/some/endpoint`).expect(504);
        expect(response.status).toBe(504);
      });
    });

    describe('option.on.error - custom error handler', () => {
      beforeEach(() => {
        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:666`, // unreachable host on port:666
              on: {
                error(err, req, res) {
                  if (err) {
                    (res as express.Response).writeHead(418); // different error code
                    res.end("I'm a teapot"); // no response body
                  }
                },
              },
            }),
          ),
        );
      });

      it('should respond with custom http status code', async () => {
        const response = await agent.get(`/api/some/endpoint`).expect(418);
        expect(response.status).toBe(418);
      });

      it('should respond with custom status message', async () => {
        const response = await agent.get(`/api/some/endpoint`).expect(418);
        expect(response.text).toBe("I'm a teapot");
      });
    });

    describe('option.onProxyRes', () => {
      beforeEach(() => {
        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: '/api',
              on: {
                proxyRes: (proxyRes, req, res) => {
                  // tslint:disable-next-line: no-string-literal
                  proxyRes['headers']['x-added'] = 'foobar'; // add custom header to response
                  // tslint:disable-next-line: no-string-literal
                  delete proxyRes['headers']['x-removed'];
                },
              },
            }),
          ),
        );
      });

      it('should add `x-added` as custom header to response"', async () => {
        await mockTargetServer.forGet().thenReply(200, 'HELLO .html');
        const response = await agent.get(`/api/some/endpoint/index.html`).expect(200);
        expect(response.header['x-added']).toBe('foobar');
      });

      it('should remove `x-removed` field from response header"', async () => {
        await mockTargetServer.forGet().thenCallback((req) => {
          return {
            statusCode: 200,
            headers: {
              'x-removed': 'this should be removed',
            },
          };
        });
        const response = await agent.get(`/api/some/endpoint/index.html`).expect(200);
        expect(response.header['x-removed']).toBeUndefined();
      });
    });

    describe('option.onProxyReq', () => {
      beforeEach(() => {
        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: '/api',
              on: {
                proxyReq: (proxyReq, req, res) => {
                  proxyReq.setHeader('x-added', 'added-from-hpm'); // add custom header to request
                },
              },
            }),
          ),
        );
      });

      it('should add `x-added` as custom header to request"', async () => {
        let completedRequest: CompletedRequest | undefined;
        await mockTargetServer.forGet().thenCallback((req) => {
          completedRequest = req;
          return { statusCode: 200 };
        });

        await agent.get(`/api/foo/bar`).expect(200);

        expect(completedRequest?.headers['x-added']).toBe('added-from-hpm');
      });
    });

    describe('option.pathRewrite', () => {
      beforeEach(() => {
        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathRewrite: {
                '^/api': '/rest',
                '^/remove': '',
              },
            }),
          ),
        );
      });

      it('should have rewritten path from "/api/foo/bar" to "/rest/foo/bar"', async () => {
        await mockTargetServer.forGet('/rest/foo/bar').thenReply(200, 'HELLO /rest/foo/bar');
        const response = await agent.get(`/api/foo/bar`).expect(200);
        expect(response.text).toBe('HELLO /rest/foo/bar');
      });

      it('should have removed path from "/remove/api/lipsum" to "/api/lipsum"', async () => {
        await mockTargetServer.forGet('/api/lipsum').thenReply(200, 'HELLO /api/lipsum');
        const response = await agent.get(`/remove/api/lipsum`).expect(200);
        expect(response.text).toBe('HELLO /api/lipsum');
      });
    });

    describe('express with path + proxy', () => {
      beforeEach(() => {
        agent = request(
          createAppWithPath(
            '/api',
            createProxyMiddleware({ target: `http://localhost:${mockTargetServer.port}/api` }),
          ),
        );
      });

      it('should proxy to target with the baseUrl', async () => {
        await mockTargetServer.forGet('/api/foo/bar').thenReply(200, 'HELLO /api/foo/bar');
        const response = await agent.get(`/api/foo/bar`).expect(200);
        expect(response.text).toBe('HELLO /api/foo/bar');
      });
    });

    describe('option.logger', () => {
      let logMessages: string[];
      let customLogger: Logger;

      beforeEach(() => {
        logMessages = [];
        customLogger = {
          info: (message: string) => logMessages.push(message),
          warn: (message: string) => logMessages.push(message),
          error: (message: string) => logMessages.push(message),
        };
      });

      it('should have logged messages', async () => {
        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: '/api',
              logger: customLogger,
            }),
          ),
        );

        await mockTargetServer.forGet('/api/foo/bar').thenReply(200);
        await agent.get(`/api/foo/bar`).expect(200);

        expect(logMessages).not.toBeUndefined();
        expect(logMessages.length).toBe(1);
        expect(logMessages.at(0)).toBe(
          `[HPM] GET /api/foo/bar -> http://localhost:${mockTargetServer.port}/api/foo/bar [200]`,
        );
      });

      it('should have logged messages when router used', async () => {
        agent = request(
          createApp(
            createProxyMiddleware({
              router: () => `http://localhost:${mockTargetServer.port}`,
              pathFilter: '/api',
              logger: customLogger,
            }),
          ),
        );

        await mockTargetServer.forGet('/api/foo/bar').thenReply(200);
        await agent.get(`/api/foo/bar`).expect(200);

        expect(logMessages).not.toBeUndefined();
        expect(logMessages.length).toBe(1);
        expect(logMessages.at(0)).toBe(
          `[HPM] GET /api/foo/bar -> http://localhost:${mockTargetServer.port}/api/foo/bar [200]`,
        );
      });
    });
  });
});
