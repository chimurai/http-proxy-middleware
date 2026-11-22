import { Agent as HttpAgent } from 'node:http';
import { Agent as HttpsAgent } from 'node:https';

import { HttpsProxyAgent } from 'https-proxy-agent';
import type { Mockttp } from 'mockttp';
import { generateCACertificate, getLocal } from 'mockttp';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Logger } from '../../src/types.js';
import { createApp, createProxyMiddleware, isIPv6Available } from './test-kit.js';

const ipv6Available = await isIPv6Available();

describe('agent option', () => {
  describe('http.Agent', () => {
    let targetServer: Mockttp;

    beforeEach(async () => {
      targetServer = getLocal();
      await targetServer.start();
    });

    afterEach(async () => {
      await targetServer.stop();
    });

    it('logs the target port', async () => {
      await targetServer.forGet('/api').thenReply(200, 'OK');

      const logger: Logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };
      const proxy = createProxyMiddleware({
        target: `http://127.0.0.1:${targetServer.port}`,
        changeOrigin: true,
        agent: new HttpAgent(),
        logger,
      });

      await request(createApp(proxy)).get('/api').expect(200, 'OK');

      expect(logger.info).toHaveBeenCalledWith(
        `[HPM] GET /api -> http://127.0.0.1:${targetServer.port}/api [200]`,
      );
    });

    it('should log the correct target ports for concurrent requests sharing an agent', async () => {
      const secondTargetServer = getLocal();
      await secondTargetServer.start();

      const proxyAgent = new HttpAgent();
      const logger: Logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };
      let signalFirstRequest!: () => void;
      const firstRequestReceived = new Promise<void>((resolve) => {
        signalFirstRequest = resolve;
      });
      let releaseFirstResponse!: () => void;
      const firstResponseReleased = new Promise<void>((resolve) => {
        releaseFirstResponse = resolve;
      });
      let firstResponse: Promise<unknown> | undefined;

      try {
        await targetServer.forGet('/first').thenCallback(async () => {
          signalFirstRequest();
          await firstResponseReleased;
          return { statusCode: 200, body: 'first' };
        });
        await secondTargetServer.forGet('/second').thenReply(200, 'second');

        const firstTarget = `http://127.0.0.1:${targetServer.port}`;
        const secondTarget = `http://127.0.0.1:${secondTargetServer.port}`;
        const app = createApp(
          createProxyMiddleware({
            target: firstTarget,
            router: (req) => (req.url === '/second' ? secondTarget : firstTarget),
            changeOrigin: true,
            agent: proxyAgent,
            logger,
          }),
        );

        firstResponse = request(app).get('/first').expect(200, 'first').then();
        await Promise.race([
          firstRequestReceived,
          firstResponse.then(() => {
            throw new Error('First response completed before the second request');
          }),
        ]);
        await request(app).get('/second').expect(200, 'second');
        releaseFirstResponse();
        await firstResponse;

        expect(logger.info).toHaveBeenCalledWith(`[HPM] GET /first -> ${firstTarget}/first [200]`);
        expect(logger.info).toHaveBeenCalledWith(
          `[HPM] GET /second -> ${secondTarget}/second [200]`,
        );
      } finally {
        releaseFirstResponse();
        await Promise.allSettled(firstResponse ? [firstResponse] : []);
        proxyAgent.destroy();
        await secondTargetServer.stop();
      }
    });
  });

  describe('https.Agent', () => {
    let targetServer: Mockttp;
    let caCertificate: string;

    beforeEach(async () => {
      const certificate = await generateCACertificate({ bits: 2048 });
      caCertificate = certificate.cert;
      targetServer = getLocal({ https: certificate });
      await targetServer.start();
    });

    afterEach(async () => {
      await targetServer.stop();
    });

    it('logs the target port', async () => {
      await targetServer.forGet('/api').thenReply(200, 'OK');

      const logger: Logger = {
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };
      const proxy = createProxyMiddleware({
        target: `https://localhost:${targetServer.port}`,
        changeOrigin: true,
        agent: new HttpsAgent({ ca: caCertificate }),
        logger,
      });

      await request(createApp(proxy)).get('/api').expect(200, 'OK');

      expect(logger.info).toHaveBeenCalledWith(
        `[HPM] GET /api -> https://localhost:${targetServer.port}/api [200]`,
      );
    });
  });

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

    it('logs the correct target ports for concurrent tunnels sharing an agent', async () => {
      const secondTargetServer = getLocal();
      await secondTargetServer.start();
      const agent = new HttpsProxyAgent(forwardProxy.url);
      const logger: Logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
      let signalFirstRequest!: () => void;
      const firstRequestReceived = new Promise<void>((resolve) => {
        signalFirstRequest = resolve;
      });
      let releaseFirstResponse!: () => void;
      const firstResponseReleased = new Promise<void>((resolve) => {
        releaseFirstResponse = resolve;
      });
      let firstResponse: Promise<unknown> | undefined;

      try {
        await targetServer.forGet('/first').thenCallback(async () => {
          signalFirstRequest();
          await firstResponseReleased;
          return { statusCode: 200, body: 'first' };
        });
        await secondTargetServer.forGet('/second').thenReply(200, 'second');
        await forwardProxy.forAnyRequest().thenPassThrough();

        const firstTarget = `http://127.0.0.1:${targetServer.port}`;
        const secondTarget = `http://127.0.0.1:${secondTargetServer.port}`;
        const app = createApp(
          createProxyMiddleware({
            target: firstTarget,
            router: (req) => (req.url === '/second' ? secondTarget : firstTarget),
            headers: { host: 'different.example:1234' },
            agent,
            logger,
          }),
        );

        firstResponse = request(app).get('/first').expect(200, 'first').then();
        await Promise.race([
          firstRequestReceived,
          firstResponse.then(() => {
            throw new Error('First response completed before the second request');
          }),
        ]);
        await request(app).get('/second').expect(200, 'second');
        releaseFirstResponse();
        await firstResponse;

        expect(logger.info).toHaveBeenCalledWith(`[HPM] GET /first -> ${firstTarget}/first [200]`);
        expect(logger.info).toHaveBeenCalledWith(
          `[HPM] GET /second -> ${secondTarget}/second [200]`,
        );
      } finally {
        releaseFirstResponse();
        await Promise.allSettled(firstResponse ? [firstResponse] : []);
        agent.destroy();
        await secondTargetServer.stop();
      }
    });

    it('logs the HTTPS target port instead of the tunnel proxy port', async () => {
      const certificate = await generateCACertificate({ bits: 2048 });
      const secureTargetServer = getLocal({ https: certificate });
      const httpsForwardProxy = getLocal({ https: certificate });
      await secureTargetServer.start();
      await httpsForwardProxy.start();
      const agent = new HttpsProxyAgent(httpsForwardProxy.url, { ca: certificate.cert });

      try {
        await secureTargetServer.forGet('/api').thenReply(200, 'OK');
        await httpsForwardProxy
          .forAnyRequest()
          .thenPassThrough({ ignoreHostHttpsErrors: ['localhost'] });
        const logger: Logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
        const target = `https://localhost:${secureTargetServer.port}`;
        const proxy = createProxyMiddleware({
          target,
          agent,
          secure: false,
          changeOrigin: true,
          logger,
        });

        await request(createApp(proxy)).get('/api').expect(200, 'OK');
        expect(logger.info).toHaveBeenCalledWith(`[HPM] GET /api -> ${target}/api [200]`);
      } finally {
        agent.destroy();
        await httpsForwardProxy.stop();
        await secureTargetServer.stop();
      }
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
