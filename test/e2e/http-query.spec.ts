import { type AddressInfo } from 'node:net';

import bodyParser from 'body-parser';
import type { Express } from 'express';
import type { CompletedRequest, Mockttp } from 'mockttp';
import { getLocal } from 'mockttp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp, createProxyMiddleware, fixRequestBody } from './test-kit.js';

type QueryRequestOptions = {
  query?: Record<string, string>;
  headers?: Record<string, string>;
  body?: string | Record<string, unknown>;
};

/**
 * `supertest` does not support the QUERY method, so we have to implement a custom request sender for it.
 */
async function sendQuery(
  app: Express,
  path: string,
  { query, headers, body }: QueryRequestOptions = {},
): Promise<{ status: number; text: string; headers: Headers }> {
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve) => server.once('listening', resolve));

  try {
    const { port } = server.address() as AddressInfo;
    const requestUrl = new URL(`http://127.0.0.1:${port}${path}`);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        requestUrl.searchParams.append(key, value);
      }
    }

    const payload =
      body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body);

    const response = await fetch(requestUrl, {
      method: 'QUERY',
      headers,
      body: payload,
    });

    return {
      status: response.status,
      text: await response.text(),
      headers: response.headers,
    };
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      }),
    );
  }
}

describe('E2E HTTP QUERY method', () => {
  let mockTargetServer: Mockttp;

  beforeEach(async () => {
    mockTargetServer = getLocal();
    await mockTargetServer.start();
  });

  afterEach(async () => {
    await mockTargetServer.stop();
  });

  describe('QUERY method proxying', () => {
    it('should proxy QUERY method and uri-query to target', async () => {
      let completedRequest: CompletedRequest | undefined;

      await mockTargetServer.forAnyRequest().thenCallback((req) => {
        completedRequest = req;
        return { statusCode: 200, body: 'QUERY OK' };
      });

      const app = createApp(
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathFilter: '/api',
        }),
      );

      const response = await sendQuery(app, '/api/search', {
        query: { q: 'proxy middleware', sort: 'name' },
      });

      expect(response.status).toBe(200);
      expect(response.text).toBe('QUERY OK');

      expect(completedRequest).toBeDefined();
      expect(completedRequest?.method).toBe('QUERY');
      expect(new URL(completedRequest!.url).pathname).toBe('/api/search');

      const targetUrl = new URL(completedRequest!.url);
      expect(targetUrl.searchParams.get('q')).toBe('proxy middleware');
      expect(targetUrl.searchParams.get('sort')).toBe('name');
    });

    it('should preserve encoded query values in QUERY requests', async () => {
      let completedRequest: CompletedRequest | undefined;

      await mockTargetServer.forAnyRequest().thenCallback((req) => {
        completedRequest = req;
        return { statusCode: 200, body: 'ENCODING OK' };
      });

      const app = createApp(
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathFilter: '/api',
        }),
      );

      const response = await sendQuery(app, '/api/encoded', {
        query: {
          q: 'a+b c',
          filter: 'name/email?yes',
        },
      });

      expect(response.status).toBe(200);
      expect(response.text).toBe('ENCODING OK');

      const targetUrl = new URL(completedRequest!.url);
      expect(targetUrl.searchParams.get('q')).toBe('a+b c');
      expect(targetUrl.searchParams.get('filter')).toBe('name/email?yes');
    });

    it('should proxy QUERY request body when fixRequestBody is enabled', async () => {
      let completedRequest: CompletedRequest | undefined;

      await mockTargetServer.forAnyRequest().thenCallback((req) => {
        completedRequest = req;
        return { statusCode: 200, body: 'BODY OK' };
      });

      const app = createApp(
        bodyParser.json(),
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathFilter: '/api',
          on: {
            proxyReq: fixRequestBody,
          },
        }),
      );

      const response = await sendQuery(app, '/api/body', {
        headers: { 'content-type': 'application/json' },
        body: { term: 'query-body', limit: 3 },
      });

      expect(response.status).toBe(200);
      expect(response.text).toBe('BODY OK');

      expect(completedRequest).toBeDefined();
      expect(completedRequest?.method).toBe('QUERY');
      expect(await completedRequest!.body.getJson()).toEqual({ term: 'query-body', limit: 3 });
    });

    it('should pass through 204 responses for QUERY requests', async () => {
      await mockTargetServer.forAnyRequest().thenReply(204);

      const app = createApp(
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathFilter: '/api',
        }),
      );

      const response = await sendQuery(app, '/api/no-content');
      expect(response.status).toBe(204);
      expect(response.text).toBe('');
    });

    it('should pass through error responses for QUERY requests', async () => {
      await mockTargetServer.forAnyRequest().thenReply(422, 'invalid-query');

      const app = createApp(
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathFilter: '/api',
        }),
      );

      const response = await sendQuery(app, '/api/invalid', {
        query: { q: '' },
      });

      expect(response.status).toBe(422);
      expect(response.text).toBe('invalid-query');
    });

    it('should pass through 400 when QUERY body uses fetch default Content-Type', async () => {
      let completedRequest: CompletedRequest | undefined;

      await mockTargetServer.forAnyRequest().thenCallback((req) => {
        completedRequest = req;
        return { statusCode: 400, body: 'unsupported-default-content-type' };
      });

      const app = createApp(
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathFilter: '/api',
        }),
      );

      const response = await sendQuery(app, '/api/strict-content-type', {
        body: '{"term":"missing-header"}',
      });

      expect(response.status).toBe(400);
      expect(response.text).toBe('unsupported-default-content-type');
      expect(completedRequest?.method).toBe('QUERY');
      expect(completedRequest?.headers['content-type']).toBe('text/plain;charset=UTF-8');
    });

    it('should pass through 400 when QUERY Content-Type is inconsistent with content', async () => {
      await mockTargetServer.forAnyRequest().thenReply(400, 'invalid-content-for-type');

      const app = createApp(
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathFilter: '/api',
        }),
      );

      const response = await sendQuery(app, '/api/content-mismatch', {
        headers: { 'content-type': 'application/json' },
        body: 'term=not-json',
      });

      expect(response.status).toBe(400);
      expect(response.text).toBe('invalid-content-for-type');
    });

    it('should pass through 415 and Accept-Query for unsupported QUERY media type', async () => {
      await mockTargetServer.forAnyRequest().thenReply(415, 'unsupported-media-type', {
        'accept-query': 'application/jsonpath, application/sql',
      });

      const app = createApp(
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathFilter: '/api',
        }),
      );

      const response = await sendQuery(app, '/api/unsupported-query-format', {
        headers: { 'content-type': 'application/x-custom-query' },
        body: 'SELECT * FROM contacts',
      });

      expect(response.status).toBe(415);
      expect(response.text).toBe('unsupported-media-type');
      expect(response.headers.get('accept-query')).toBe('application/jsonpath, application/sql');
    });

    it('should pass through 405 and Allow when QUERY is not supported on target resource', async () => {
      await mockTargetServer.forAnyRequest().thenReply(405, 'method-not-allowed', {
        allow: 'GET, OPTIONS, HEAD',
      });

      const app = createApp(
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathFilter: '/api',
        }),
      );

      const response = await sendQuery(app, '/api/not-supported', {
        headers: { 'content-type': 'application/json' },
        body: { term: 'fallback-discovery' },
      });

      expect(response.status).toBe(405);
      expect(response.text).toBe('method-not-allowed');
      expect(response.headers.get('allow')).toBe('GET, OPTIONS, HEAD');
    });
  });

  describe('QUERY with proxy options', () => {
    it('should apply pathFilter for QUERY requests', async () => {
      const targetSpy = vi.fn();

      await mockTargetServer.forAnyRequest().thenCallback(() => {
        targetSpy();
        return { statusCode: 200, body: 'SHOULD NOT HAPPEN' };
      });

      const app = createApp(
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathFilter: '/api',
        }),
      );

      const response = await sendQuery(app, '/outside/filter');

      expect(response.status).toBe(404);
      expect(targetSpy).toHaveBeenCalledTimes(0);
    });

    it('should rewrite path for QUERY requests', async () => {
      let completedRequest: CompletedRequest | undefined;

      await mockTargetServer.forAnyRequest().thenCallback((req) => {
        completedRequest = req;
        return { statusCode: 200, body: 'REWRITE OK' };
      });

      const app = createApp(
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathRewrite: {
            '^/legacy': '/api',
          },
        }),
      );

      const response = await sendQuery(app, '/legacy/search', {
        query: { q: 'rewrite' },
      });

      expect(response.status).toBe(200);
      expect(response.text).toBe('REWRITE OK');
      expect(completedRequest?.method).toBe('QUERY');
      expect(new URL(completedRequest!.url).pathname).toBe('/api/search');

      const targetUrl = new URL(completedRequest!.url);
      expect(targetUrl.search).toBe('?q=rewrite');
    });

    it('should apply router target selection for QUERY requests', async () => {
      const routerTarget = getLocal();
      await routerTarget.start();

      let routedRequest: CompletedRequest | undefined;

      try {
        await mockTargetServer.forAnyRequest().thenReply(200, 'DEFAULT TARGET');
        await routerTarget.forAnyRequest().thenCallback((req) => {
          routedRequest = req;
          return { statusCode: 200, body: 'ROUTED TARGET' };
        });

        const app = createApp(
          createProxyMiddleware({
            target: mockTargetServer.url,
            router: (req) => {
              return req.url?.startsWith('/api/routed') ? routerTarget.url : mockTargetServer.url;
            },
          }),
        );

        const response = await sendQuery(app, '/api/routed', {
          query: { via: 'router' },
        });

        expect(response.status).toBe(200);
        expect(response.text).toBe('ROUTED TARGET');
        expect(routedRequest?.method).toBe('QUERY');
        expect(new URL(routedRequest!.url).pathname).toBe('/api/routed');
      } finally {
        await routerTarget.stop();
      }
    });

    it('should change host header for QUERY when changeOrigin is true', async () => {
      let completedRequest: CompletedRequest | undefined;

      await mockTargetServer.forAnyRequest().thenCallback((req) => {
        completedRequest = req;
        return { statusCode: 200, body: 'CHANGE ORIGIN OK' };
      });

      const app = createApp(
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathFilter: '/api',
          changeOrigin: true,
        }),
      );

      const response = await sendQuery(app, '/api/change-origin');

      expect(response.status).toBe(200);
      expect(response.text).toBe('CHANGE ORIGIN OK');

      const targetHost = new URL(mockTargetServer.url).host;
      expect(completedRequest?.headers.host).toBe(targetHost);
    });

    it('should forward custom headers for QUERY requests', async () => {
      let completedRequest: CompletedRequest | undefined;

      await mockTargetServer.forAnyRequest().thenCallback((req) => {
        completedRequest = req;
        return { statusCode: 200, body: 'HEADERS OK' };
      });

      const app = createApp(
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathFilter: '/api',
        }),
      );

      const response = await sendQuery(app, '/api/headers', {
        headers: {
          'x-query-scenario': 'strict-shape-check',
        },
      });

      expect(response.status).toBe(200);
      expect(response.text).toBe('HEADERS OK');
      expect(completedRequest?.headers['x-query-scenario']).toBe('strict-shape-check');
    });
  });
});
