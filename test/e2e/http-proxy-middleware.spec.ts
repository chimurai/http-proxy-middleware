import { createProxyMiddleware, createApp, createAppWithPath, fixRequestBody } from './test-kit';
import * as request from 'supertest';
import { Mockttp, getLocal, CompletedRequest } from 'mockttp';
import type { Request, Response } from '../../src/types';
import type * as express from 'express';
import * as bodyParser from 'body-parser';

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
      const mockReq: Request = {
        url: '/foo/bar',
      } as Request;
      const mockRes: Response = {} as Response;
      const mockNext: express.NextFunction = jest.fn();

      beforeEach(() => {
        const middleware = createProxyMiddleware({
          target: `http://localhost:8000`,
          pathFilter: '/api',
        });

        middleware(mockReq, mockRes, mockNext);
      });

      it('should not proxy requests when request url does not match pathFilter', () => {
        expect(mockNext).toBeCalled();
      });
    });
  });

  describe('http-proxy-middleware in actual server', () => {
    let mockTargetServer: Mockttp;
    let agent: request.SuperTest<request.Test>;

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
            })
          )
        );
      });

      it('should have response body: "HELLO WEB"', async () => {
        await mockTargetServer.get('/api').thenReply(200, 'HELLO WEB');
        const response = await agent.get(`/api`).expect(200);
        expect(response.text).toBe('HELLO WEB');
      });

      it('should have proxied the uri-path and uri-query, but not the uri-hash', async () => {
        await mockTargetServer
          .get('/api/b/c/dp')
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
            })
          )
        );

        await mockTargetServer.post('/api').thenCallback((req) => {
          expect(req.body.text).toBe('foo=bar&bar=baz');
          return { status: 200 };
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
            })
          )
        );

        await mockTargetServer.post('/api').thenCallback((req) => {
          expect(req.body.json).toEqual({ foo: 'bar', bar: 'baz', doubleByte: '文' });
          return { status: 200 };
        });
        await agent.post('/api').send({ foo: 'bar', bar: 'baz', doubleByte: '文' }).expect(200);
      });
    });

    describe('custom pathFilter matcher/filter', () => {
      it('should have response body: "HELLO WEB"', async () => {
        const filter = (path, req) => {
          return true;
        };

        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: filter,
            })
          )
        );

        await mockTargetServer.get('/api/b/c/d').thenReply(200, 'HELLO WEB');
        const response = await agent.get(`/api/b/c/d`).expect(200);
        expect(response.text).toBe('HELLO WEB');
      });

      it('should not proxy when filter returns false', async () => {
        const filter = (path, req) => {
          return false;
        };

        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: filter,
            })
          )
        );

        await mockTargetServer.get('/api/b/c/d').thenReply(200, 'HELLO WEB');
        const response = await agent.get(`/api/b/c/d`).expect(404);
        expect(response.status).toBe(404);
      });
    });

    describe('multi path', () => {
      beforeEach(() => {
        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: ['/api', '/ajax'],
            })
          )
        );
      });

      it('should proxy to path /api', async () => {
        await mockTargetServer.get(/\/api\/.+/).thenReply(200, 'HELLO /API');
        const response = await agent.get(`/api/b/c/d`).expect(200);
        expect(response.text).toBe('HELLO /API');
      });

      it('should proxy to path /ajax', async () => {
        await mockTargetServer.get(/\/ajax\/.+/).thenReply(200, 'HELLO /AJAX');
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
            })
          )
        );
      });

      it('should proxy to path', async () => {
        await mockTargetServer.get(/\/api\/.+/).thenReply(200, 'HELLO /api');
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
            })
          )
        );
      });

      it('should proxy to paths ending with *.html', async () => {
        await mockTargetServer.get(/.+html$/).thenReply(200, 'HELLO .html');
        const response = await agent.get(`/api/some/endpoint/index.html`).expect(200);
        expect(response.text).toBe('HELLO .html');
      });

      it('should not proxy to paths ending with *.json', async () => {
        await mockTargetServer.get(/.+json$/).thenReply(200, 'HELLO .html');
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
            })
          )
        );
      });

      it('should send request header "host" to target server', async () => {
        let completedRequest: CompletedRequest;

        await mockTargetServer.get().thenCallback((req) => {
          completedRequest = req;
          return { statusCode: 200, body: 'OK' };
        });

        const response = await agent.get(`/api/some/endpoint/index.html`).expect(200);
        expect(response.text).toBe('OK');
        expect(completedRequest.headers.host).toBe('foobar.dev');
      });
    });

    describe('default httpProxy on error handling', () => {
      beforeEach(() => {
        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:666`, // unreachable host on port:666
            })
          )
        );
      });

      it('should handle errors when host is not reachable', async () => {
        const response = await agent.get(`/api/some/endpoint`).expect(504);
        expect(response.status).toBe(504);
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
            })
          )
        );
      });

      it('should add `x-added` as custom header to response"', async () => {
        await mockTargetServer.get().thenReply(200, 'HELLO .html');
        const response = await agent.get(`/api/some/endpoint/index.html`).expect(200);
        expect(response.header['x-added']).toBe('foobar');
      });

      it('should remove `x-removed` field from response header"', async () => {
        await mockTargetServer.get().thenCallback((req) => {
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
            })
          )
        );
      });

      it('should add `x-added` as custom header to request"', async () => {
        let completedRequest: CompletedRequest;
        await mockTargetServer.get().thenCallback((req) => {
          completedRequest = req;
          return { statusCode: 200 };
        });

        await agent.get(`/api/foo/bar`).expect(200);

        expect(completedRequest.headers['x-added']).toBe('added-from-hpm');
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
            })
          )
        );
      });

      it('should have rewritten path from "/api/foo/bar" to "/rest/foo/bar"', async () => {
        await mockTargetServer.get('/rest/foo/bar').thenReply(200, 'HELLO /rest/foo/bar');
        const response = await agent.get(`/api/foo/bar`).expect(200);
        expect(response.text).toBe('HELLO /rest/foo/bar');
      });

      it('should have removed path from "/remove/api/lipsum" to "/api/lipsum"', async () => {
        await mockTargetServer.get('/api/lipsum').thenReply(200, 'HELLO /api/lipsum');
        const response = await agent.get(`/remove/api/lipsum`).expect(200);
        expect(response.text).toBe('HELLO /api/lipsum');
      });
    });

    describe('express with path + proxy', () => {
      beforeEach(() => {
        agent = request(
          createAppWithPath(
            '/api',
            createProxyMiddleware({ target: `http://localhost:${mockTargetServer.port}/api` })
          )
        );
      });

      it('should proxy to target with the baseUrl', async () => {
        await mockTargetServer.get('/api/foo/bar').thenReply(200, 'HELLO /api/foo/bar');
        const response = await agent.get(`/api/foo/bar`).expect(200);
        expect(response.text).toBe('HELLO /api/foo/bar');
      });
    });

    describe('option.logger', () => {
      let logMessages: string[];

      beforeEach(() => {
        logMessages = [];
        const customLogger = {
          log: (message: string) => {
            logMessages.push(message);
          },
        };

        agent = request(
          createApp(
            createProxyMiddleware({
              target: `http://localhost:${mockTargetServer.port}`,
              pathFilter: '/api',
              logger: customLogger,
            })
          )
        );
      });

      it('should have logged messages', async () => {
        await mockTargetServer.get('/api/foo/bar').thenReply(200);
        await agent.get(`/api/foo/bar`).expect(200);

        expect(logMessages).not.toBeUndefined();
        expect(logMessages.length).toBe(2);
        expect(logMessages[0]).toContain('[HPM] Proxy created:');
        expect(logMessages[1]).toBe('[HPM] server close signal received: closing proxy server');
      });
    });
  });
});
