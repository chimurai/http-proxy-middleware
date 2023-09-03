import { createProxyMiddleware, createApp } from './test-kit';
import * as request from 'supertest';
import { getLocal, Mockttp } from 'mockttp';

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
            target: `http://localhost:${mockTargetServer.port}`,
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
            target: `http://localhost:${mockTargetServer.port}`,
            pathRewrite(path, req) {
              return path.replace('/foobar', '');
            },
          }),
        ),
      );

      const response = await agent.get('/foobar/api/lorum/ipsum').expect(200);
      expect(response.text).toBe('/API RESPONSE AFTER PATH REWRITE FUNCTION');
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
            target: `http://localhost:${mockTargetServer.port}`,
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
