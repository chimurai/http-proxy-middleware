import type { Mockttp } from 'mockttp';
import { getLocal } from 'mockttp';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createApp, createProxyMiddleware, isIPv6Available } from './test-kit.js';

describe.runIf(await isIPv6Available())('ipv6 integration', () => {
  let targetServer: Mockttp;

  beforeEach(async () => {
    targetServer = getLocal();
    await targetServer.start();
  });

  afterEach(async () => {
    await targetServer.stop();
  });

  it('should proxy to ipv6 target using bracket notation with port', async () => {
    await targetServer.forGet('/api').thenCallback((req) => ({
      statusCode: 200,
      body: req.path,
    }));

    const proxy = createProxyMiddleware({
      changeOrigin: true,
      target: `http://[::1]:${targetServer.port}`,
    });

    const app = createApp(proxy);
    const response = await request(app).get('/api').expect(200);

    expect(response.text).toBe('/api');
  });

  it('should proxy to unspecified ipv6 target using bracket notation with port', async () => {
    await targetServer.forGet('/api').thenCallback((req) => ({
      statusCode: 200,
      body: req.path,
    }));

    const proxy = createProxyMiddleware({
      changeOrigin: true,
      target: `http://[::]:${targetServer.port}`,
    });

    const app = createApp(proxy);
    const response = await request(app).get('/api').expect(200);

    expect(response.text).toBe('/api');
  });

  it('should proxy to ipv6 target and preserve query params', async () => {
    let receivedPath: string | undefined;

    await targetServer.forGet('/api').thenCallback((req) => {
      receivedPath = req.path;
      return {
        statusCode: 200,
        body: req.url.includes('?') ? req.url.split('?')[1] : '',
      };
    });

    const proxy = createProxyMiddleware({
      changeOrigin: true,
      target: `http://[::1]:${targetServer.port}`,
    });

    const app = createApp(proxy);
    const response = await request(app).get('/api?foo=bar&baz=qux').expect(200);

    expect(receivedPath).toBe('/api?foo=bar&baz=qux');
    expect(response.text).toBe('foo=bar&baz=qux');
  });

  it('should proxy to ipv6 target and preserve search params with special characters', async () => {
    let receivedPath: string | undefined;

    await targetServer.forGet('/api').thenCallback((req) => {
      receivedPath = req.path;
      return {
        statusCode: 200,
        body: req.url.includes('?') ? req.url.split('?')[1] : '',
      };
    });

    const proxy = createProxyMiddleware({
      changeOrigin: true,
      target: `http://[::1]:${targetServer.port}`,
    });

    const app = createApp(proxy);
    const response = await request(app).get('/api?q=hello%20world&page=1').expect(200);

    expect(receivedPath).toBe('/api?q=hello%20world&page=1');
    expect(response.text).toBe('q=hello%20world&page=1');
  });

  it('should forward requests to ipv6 target using forward option', async () => {
    let forwardedPath: string | undefined;

    await targetServer.forPost('/api').thenCallback((req) => {
      forwardedPath = req.path;
      return { statusCode: 200 };
    });

    const proxy = createProxyMiddleware({
      changeOrigin: true,
      target: `http://[::1]:${targetServer.port}`,
      forward: `http://[::1]:${targetServer.port}`,
    });

    const app = createApp(proxy);
    await request(app).post('/api').expect(200);

    expect(forwardedPath).toBe('/api');
  });

  it('should proxy to ipv6 target resolved via router function (no static target)', async () => {
    await targetServer.forGet('/api').thenCallback((req) => ({
      statusCode: 200,
      body: req.path,
    }));

    const proxy = createProxyMiddleware({
      changeOrigin: true,
      target: 'http://example.com', // dummy target, will be overridden by router
      router: () => `http://[::1]:${targetServer.port}`,
    });

    const app = createApp(proxy);
    const response = await request(app).get('/api').expect(200);

    expect(response.text).toBe('/api');
  });

  it('should proxy to ipv6 target resolved via async router function', async () => {
    await targetServer.forGet('/api').thenCallback((req) => ({
      statusCode: 200,
      body: req.path,
    }));

    const proxy = createProxyMiddleware({
      changeOrigin: true,
      target: 'http://example.com', // dummy target, will be overridden by router
      router: async () => `http://[::1]:${targetServer.port}`,
    });

    const app = createApp(proxy);
    const response = await request(app).get('/api').expect(200);

    expect(response.text).toBe('/api');
  });

  it('should proxy to ipv6 target with base path and auth option', async () => {
    let receivedPath: string | undefined;
    let authorizationHeader: string | undefined;

    await targetServer.forGet('/api').thenCallback((req) => {
      receivedPath = req.path;
      const authHeader = req.headers.authorization;
      authorizationHeader = Array.isArray(authHeader) ? authHeader[0] : authHeader;

      return {
        statusCode: 200,
      };
    });

    const proxy = createProxyMiddleware({
      changeOrigin: true,
      target: `http://[::1]:${targetServer.port}/api`,
      auth: 'user:pass',
    });

    const app = createApp(proxy);
    await request(app).get('/').expect(200);

    expect(receivedPath).toBe('/api');
    expect(authorizationHeader).toBe('Basic dXNlcjpwYXNz'); // cspell:disable-line
  });
});
