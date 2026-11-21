import { HttpsProxyAgent } from 'https-proxy-agent';
import type { Mockttp } from 'mockttp';
import { getLocal } from 'mockttp';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Logger } from '../../src/types.js';
import { createApp, createProxyMiddleware, isIPv6Available } from './test-kit.js';

const ipv6Available = await isIPv6Available();

describe('agent option', () => {
  describe('HttpsProxyAgent', () => {
    let targetServer: Mockttp;
    let forwardProxy: Mockttp;

    beforeEach(async () => {
      targetServer = getLocal();
      forwardProxy = getLocal();
      await targetServer.start();
      await forwardProxy.start();
    });

    afterEach(async () => {
      await forwardProxy.stop();
      await targetServer.stop();
    });

    it('logs the target port for an IPv4 target', async () => {
      await targetServer.forGet('/api').thenReply(200, 'OK');
      await forwardProxy.forAnyRequest().thenPassThrough();

      const logger: Logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };
      const agent = new HttpsProxyAgent(forwardProxy.url);
      const onConnect = vi.fn();
      agent.on('proxyConnect', onConnect);

      const proxy = createProxyMiddleware({
        target: `http://127.0.0.1:${targetServer.port}`,
        changeOrigin: true,
        agent,
        logger,
      });

      await request(createApp(proxy)).get('/api').expect(200, 'OK');

      expect(onConnect).toHaveBeenCalledOnce();
      expect(logger.info).toHaveBeenCalledWith(
        `[HPM] GET /api -> http://127.0.0.1:${targetServer.port}/api [200]`,
      );
    });

    it.runIf(ipv6Available)('logs the target port for an IPv6 target', async () => {
      await targetServer.forGet('/api').thenReply(200, 'OK');
      await forwardProxy.forAnyRequest().thenPassThrough();

      const logger: Logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };
      const agent = new HttpsProxyAgent(forwardProxy.url);
      const onConnect = vi.fn();
      agent.on('proxyConnect', onConnect);

      const proxy = createProxyMiddleware({
        target: `http://[::1]:${targetServer.port}`,
        changeOrigin: true,
        agent,
        logger,
      });

      await request(createApp(proxy)).get('/api').expect(200, 'OK');

      expect(onConnect).toHaveBeenCalledOnce();
      expect(logger.info).toHaveBeenCalledWith(
        `[HPM] GET /api -> http://[::1]:${targetServer.port}/api [200]`,
      );
    });
  });
});
