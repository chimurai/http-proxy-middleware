import type { HttpBindings, ServerType } from '@hono/node-server';
import { serve } from '@hono/node-server';
import getPort from 'get-port';
import { Hono } from 'hono';
import type { Mockttp } from 'mockttp';
import { getLocal } from 'mockttp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createHonoProxyMiddleware } from './test-kit.js';

describe('E2E Hono', () => {
  describe('http-proxy-middleware in actual Hono server', () => {
    let app: Hono<{ Bindings: HttpBindings }>;

    let mockTargetServer: Mockttp;

    beforeEach(async () => {
      mockTargetServer = getLocal();
      await mockTargetServer.start();
    });

    afterEach(async () => {
      await mockTargetServer.stop();
    });

    describe('basic setup, requests to target', () => {
      let server: ServerType;
      let serverPort: number;
      const logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      beforeEach(async () => {
        app = new Hono<{ Bindings: HttpBindings }>();
        serverPort = await getPort();

        app.use(
          '/api',
          createHonoProxyMiddleware({
            target: mockTargetServer.url,
            pathFilter: '/api',
            logger,
          }),
        );

        server = serve({
          fetch: app.fetch,
          port: serverPort,
        });
      });

      afterEach(() => {
        server.close();
      });

      it('should have response body: "HELLO WEB"', async () => {
        await mockTargetServer.forGet('/api').thenReply(200, 'HELLO WEB');
        const response = await fetch(`http://127.0.0.1:${serverPort}/api`);
        expect(response.status).toBe(200);
        await expect(response.text()).resolves.toBe('HELLO WEB');
      });

      it('should handle connection reset', async () => {
        await mockTargetServer.forGet('/api').thenResetConnection();
        const response = await fetch(`http://127.0.0.1:${serverPort}/api`);
        expect(response.status).toBe(504);
        expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
        expect(response.headers.get('cache-control')).toBe('no-store');
        const responseText = await response.text();
        expect(responseText).toContain('<h1>HTTP 504 error</h1>');
        expect(responseText).toContain('<p>http-proxy-middleware</p>');
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('[HPM] Error occurred while proxying request'),
          expect.any(String),
          expect.any(String),
          'ECONNRESET',
        );
      });
    });

    describe('pathFilter matching', () => {
      let server: ServerType;
      let serverPort: number;

      beforeEach(async () => {
        app = new Hono<{ Bindings: HttpBindings }>();
        serverPort = await getPort();

        app.use(
          createHonoProxyMiddleware({
            target: mockTargetServer.url,
            pathFilter: '/api',
          }),
        );

        app.get('/other', (c) => c.text('DOWNSTREAM HANDLER'));

        server = serve({
          fetch: app.fetch,
          port: serverPort,
        });
      });

      afterEach(() => {
        server.close();
      });

      it('should proxy requests when request url matches pathFilter', async () => {
        await mockTargetServer.forGet('/api').thenReply(200, 'HELLO API');

        const response = await fetch(`http://127.0.0.1:${serverPort}/api`);

        expect(response.status).toBe(200);
        await expect(response.text()).resolves.toBe('HELLO API');
      });

      it('should not proxy requests when request url does not match pathFilter', async () => {
        const response = await fetch(`http://127.0.0.1:${serverPort}/other`);

        expect(response.status).toBe(200);
        await expect(response.text()).resolves.toBe('DOWNSTREAM HANDLER');
      });
    });

    describe('error handling', () => {
      let server: ServerType;
      let serverPort: number;

      beforeEach(async () => {
        app = new Hono<{ Bindings: HttpBindings }>();
        serverPort = await getPort();

        app.use(
          '/api',
          createHonoProxyMiddleware({
            target: mockTargetServer.url,
            pathFilter: '/api',
            router: () => {
              throw new Error('router exploded');
            },
          }),
        );

        server = serve({
          fetch: app.fetch,
          port: serverPort,
        });
      });

      afterEach(() => {
        server.close();
      });

      it('should return Proxy Error when proxy middleware calls next(err)', async () => {
        const response = await fetch(`http://127.0.0.1:${serverPort}/api`);

        expect(response.status).toBe(500);
        await expect(response.text()).resolves.toBe('Proxy Error');
      });
    });
  });
});
