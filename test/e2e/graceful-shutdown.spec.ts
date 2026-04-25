import * as http from 'node:http';

import getPort from 'get-port';
import type { ProxyServer, createProxyServer } from 'httpxy';
import type { Mockttp } from 'mockttp';
import { getLocal } from 'mockttp';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp, createProxyMiddleware } from './test-kit.js';

// Capture the proxy instance created internally by HttpProxyMiddleware so we can spy on it
let capturedProxy: ProxyServer | undefined;

vi.mock('httpxy', async (importOriginal) => {
  const original = await importOriginal<{ createProxyServer: typeof createProxyServer }>();
  return {
    ...original,
    createProxyServer: (...args: Parameters<typeof original.createProxyServer>) => {
      const proxy = original.createProxyServer(...args);
      capturedProxy = proxy as unknown as ProxyServer;
      return proxy;
    },
  };
});

describe('E2E graceful shutdown', () => {
  let mockTargetServer: Mockttp;
  let proxyServer: http.Server;
  let SERVER_PORT: number;

  const closeServer = (server: http.Server) => {
    return new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  };

  beforeEach(async () => {
    capturedProxy = undefined;
    mockTargetServer = getLocal();
    await mockTargetServer.start();
    await mockTargetServer.forGet('/api').thenReply(200, 'OK');
    SERVER_PORT = await getPort();
  });

  afterEach(async () => {
    await mockTargetServer.stop();
  });

  it('should call proxy.close() when the http server closes', async () => {
    const proxyMiddleware = createProxyMiddleware({ target: mockTargetServer.url });
    const app = createApp(proxyMiddleware);

    proxyServer = http.createServer(app);
    await new Promise<void>((resolve) => proxyServer.listen(SERVER_PORT, resolve));

    expect(capturedProxy).toBeDefined();
    const proxyCloseSpy = vi.spyOn(capturedProxy!, 'close');

    // Make a request so the server.on('close') listener gets registered inside the middleware
    await request(`http://localhost:${SERVER_PORT}`).get('/api').expect(200);

    // Close the http server — this should trigger proxy.close()
    await closeServer(proxyServer);

    expect(proxyCloseSpy).toHaveBeenCalledOnce();
  });

  it('should only subscribe to server close event once across multiple requests', async () => {
    const proxyMiddleware = createProxyMiddleware({ target: mockTargetServer.url });
    const app = createApp(proxyMiddleware);

    proxyServer = http.createServer(app);
    await new Promise<void>((resolve) => proxyServer.listen(SERVER_PORT, resolve));

    expect(capturedProxy).toBeDefined();
    const proxyCloseSpy = vi.spyOn(capturedProxy!, 'close');

    await mockTargetServer.forGet('/api').thenReply(200, 'OK');

    // Multiple requests should not cause multiple close subscriptions
    await request(`http://localhost:${SERVER_PORT}`).get('/api').expect(200);
    await request(`http://localhost:${SERVER_PORT}`).get('/api').expect(200);
    await request(`http://localhost:${SERVER_PORT}`).get('/api').expect(200);

    await closeServer(proxyServer);

    // proxy.close() should still be called exactly once
    expect(proxyCloseSpy).toHaveBeenCalledOnce();
  });
});
