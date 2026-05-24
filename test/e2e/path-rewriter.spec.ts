import type { Mockttp } from 'mockttp';
import { getLocal } from 'mockttp';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createApp, createProxyMiddleware } from './test-kit.js';

describe('E2E pathRewrite', () => {
  let mockTargetServer: Mockttp;

  beforeEach(async () => {
    mockTargetServer = getLocal();
    await mockTargetServer.start();
  });

  afterEach(async () => {
    await mockTargetServer.stop();
  });

  describe('Rewrite paths with rules table', () => {
    it('should remove "/foobar" from path', async () => {
      mockTargetServer
        .forGet('/api/lorum/ipsum')
        .thenReply(200, '/API RESPONSE AFTER PATH REWRITE');

      const agent = request(
        createApp(
          createProxyMiddleware({
            target: mockTargetServer.url,
            pathRewrite: {
              '^/foobar/api/': '/api/',
            },
          }),
        ),
      );

      const response = await agent.get('/foobar/api/lorum/ipsum').expect(200);

      expect(response.text).toBe('/API RESPONSE AFTER PATH REWRITE');
    });
  });

  describe('Rewrite paths with function', () => {
    it('should remove "/foobar" from path', async () => {
      mockTargetServer
        .forGet('/api/lorum/ipsum')
        .thenReply(200, '/API RESPONSE AFTER PATH REWRITE FUNCTION');

      const agent = request(
        createApp(
          createProxyMiddleware({
            target: mockTargetServer.url,
            pathRewrite(path, req) {
              return path.replace('/foobar', '');
            },
          }),
        ),
      );

      const response = await agent.get('/foobar/api/lorum/ipsum').expect(200);
      expect(response.text).toBe('/API RESPONSE AFTER PATH REWRITE FUNCTION');
    });

    it('should expose res and options to rewrite function', async () => {
      mockTargetServer
        .forGet('/api/lorum/ipsum')
        .thenReply(200, '/API RESPONSE AFTER PATH REWRITE FUNCTION');

      let capturedRes: unknown;
      let capturedOptions: { target?: unknown } | undefined;

      const agent = request(
        createApp(
          createProxyMiddleware({
            target: mockTargetServer.url,
            pathRewrite(path, req, res, options) {
              capturedRes = res;
              capturedOptions = options;
              return path;
            },
          }),
        ),
      );

      await agent.get('/api/lorum/ipsum').expect(200);

      expect(capturedRes).toBeDefined();
      expect(capturedOptions?.target).toBe(mockTargetServer.url);
    });
  });

  describe('Rewrite paths with function which return undefined', () => {
    it('should proxy with requested path', async () => {
      mockTargetServer
        .forGet('/api/lorum/ipsum')
        .thenReply(200, '/API RESPONSE AFTER PATH REWRITE FUNCTION');

      const agent = request(
        createApp(
          createProxyMiddleware({
            target: mockTargetServer.url,
            pathRewrite(path, req) {
              return undefined;
            },
          }),
        ),
      );

      const response = await agent.get('/api/lorum/ipsum').expect(200);
      expect(response.text).toBe('/API RESPONSE AFTER PATH REWRITE FUNCTION');
    });
  });
});
