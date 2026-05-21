import { createSecureServer, type Http2SecureServer } from 'node:http2';

import type { Mockttp } from 'mockttp';
import { generateCACertificate } from 'mockttp';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp, createProxyMiddleware } from './test-kit.js';

describe('E2E http2', () => {
  // Self-signed certs are used in this test; allow local TLS connections for this spec only.
  beforeEach(() => vi.stubEnv('NODE_TLS_REJECT_UNAUTHORIZED', '0'));
  afterEach(() => vi.unstubAllEnvs());

  describe('E2E http2 to http1', () => {
    let mockTargetServer: Mockttp;
    let http2ProxyServer: Http2SecureServer | undefined;
    let proxyServerCertPem: string;

    async function closeServer(server: Http2SecureServer) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }

    beforeEach(async () => {
      const cert = await generateCACertificate({ bits: 2048 });
      proxyServerCertPem = cert.cert;

      // Keep this dynamic to avoid a Vitest module-load ordering issue that breaks cert generation.
      const { getLocal } = await import('mockttp');
      mockTargetServer = getLocal();
      await mockTargetServer.start();

      const app = createApp(
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathFilter: '/api',
        }),
      );

      http2ProxyServer = createSecureServer(
        {
          key: cert.key,
          cert: cert.cert,
          // Express + supertest use the HTTP/1.1 request/response API in this e2e flow.
          allowHTTP1: true,
        },
        (req, res) => app(req as never, res as never),
      );
    });

    afterEach(async () => {
      await mockTargetServer.stop();

      const server = http2ProxyServer;
      if (!server?.listening) {
        return;
      }

      await closeServer(server);
    });

    it('proxies requests through a secure HTTP/2 server to a mocked target', async () => {
      await mockTargetServer.forGet('/api/hello').thenReply(200, 'hello from mocked target');

      expect(http2ProxyServer).toBeDefined();
      const response = await request(http2ProxyServer!)
        .get('/api/hello')
        .ca(proxyServerCertPem)
        .expect(200);

      expect(response.text).toBe('hello from mocked target');
    });
  });

  describe('E2E http2 to http2', () => {
    let mockTargetServer: Mockttp;
    let http2ProxyServer: Http2SecureServer | undefined;
    let proxyServerCertPem: string;

    async function closeServer(server: Http2SecureServer) {
      await new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      });
    }

    beforeEach(async () => {
      const cert = await generateCACertificate({ bits: 2048 });
      proxyServerCertPem = cert.cert;

      // Keep this dynamic to avoid a Vitest module-load ordering issue that breaks cert generation.
      const { getLocal } = await import('mockttp');
      mockTargetServer = getLocal({ http2: true });
      await mockTargetServer.start();

      const app = createApp(
        createProxyMiddleware({
          target: mockTargetServer.url,
          pathFilter: '/api',
        }),
      );

      http2ProxyServer = createSecureServer(
        {
          key: cert.key,
          cert: cert.cert,
          // Express + supertest use the HTTP/1.1 request/response API in this e2e flow.
          allowHTTP1: true,
        },
        (req, res) => app(req as never, res as never),
      );
    });

    afterEach(async () => {
      await mockTargetServer.stop();

      const server = http2ProxyServer;
      if (!server?.listening) {
        return;
      }

      await closeServer(server);
    });

    it('proxies requests through a secure HTTP/2 server to an HTTP/2 mocked target', async () => {
      await mockTargetServer.forGet('/api/hello').thenReply(200, 'hello from http2 target');

      expect(http2ProxyServer).toBeDefined();
      const response = await request(http2ProxyServer!)
        .get('/api/hello')
        .ca(proxyServerCertPem)
        .expect(200);

      expect(response.text).toBe('hello from http2 target');
    });

    it('handles multiple concurrent HTTP/2 requests (multiplexing)', async () => {
      await mockTargetServer.forGet('/api/request1').thenReply(200, 'response 1');
      await mockTargetServer.forGet('/api/request2').thenReply(200, 'response 2');
      await mockTargetServer.forGet('/api/request3').thenReply(200, 'response 3');

      expect(http2ProxyServer).toBeDefined();

      // Send multiple concurrent requests to test HTTP/2 multiplexing
      const [response1, response2, response3] = await Promise.all([
        request(http2ProxyServer!).get('/api/request1').expect(200),
        request(http2ProxyServer!).get('/api/request2').expect(200),
        request(http2ProxyServer!).get('/api/request3').expect(200),
      ]);

      expect(response1.text).toBe('response 1');
      expect(response2.text).toBe('response 2');
      expect(response3.text).toBe('response 3');
    });
  });
});
