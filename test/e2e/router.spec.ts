import { ErrorRequestHandler } from 'express';
import * as getPort from 'get-port';
import { Mockttp, generateCACertificate, getLocal } from 'mockttp';
import * as request from 'supertest';
import * as TestAgent from 'supertest';

import { createApp, createAppWithPath, createProxyMiddleware } from './test-kit';

const untrustedCACert = generateCACertificate({ bits: 2048 });

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe('E2E router', () => {
  let targetServerA: Mockttp;
  let targetServerB: Mockttp;
  let targetServerC: Mockttp;

  let targetPortA: number;
  let targetPortB: number;
  let targetPortC: number;

  beforeEach(async () => {
    targetServerA = getLocal({ https: await untrustedCACert });
    targetServerB = getLocal({ https: await untrustedCACert });
    targetServerC = getLocal({ https: await untrustedCACert });

    targetPortA = await getPort();
    targetPortB = await getPort();
    targetPortC = await getPort();

    await targetServerA.forAnyRequest().thenPassThrough({ ignoreHostHttpsErrors: ['localhost'] });
    await targetServerB.forAnyRequest().thenPassThrough({ ignoreHostHttpsErrors: ['localhost'] });
    await targetServerC.forAnyRequest().thenPassThrough({ ignoreHostHttpsErrors: ['localhost'] });

    await targetServerA
      .forAnyRequest()
      .thenCallback(({ protocol }) => ({ body: protocol === 'https' ? 'A' : 'NOT HTTPS A' }));
    await targetServerB
      .forAnyRequest()
      .thenCallback(({ protocol }) => ({ body: protocol === 'https' ? 'B' : 'NOT HTTPS B' }));
    await targetServerC
      .forAnyRequest()
      .thenCallback(({ protocol }) => ({ body: protocol === 'https' ? 'C' : 'NOT HTTPS C' }));

    await targetServerA.start(targetPortA);
    await targetServerB.start(targetPortB);
    await targetServerC.start(targetPortC);
  });

  afterEach(async () => {
    await targetServerA.stop();
    await targetServerB.stop();
    await targetServerC.stop();
  });

  describe('router with req', () => {
    it('should work with a string', async () => {
      const app = createApp(
        createProxyMiddleware({
          target: `https://localhost:${targetPortA}`,
          secure: false,
          changeOrigin: true,
          router(req) {
            return `https://localhost:${targetPortC}`;
          },
        }),
      );

      const agent = request(app);
      const response = await agent.get('/api').expect(200);
      expect(response.text).toBe('C');
    });

    it('should work with an object', async () => {
      const app = createApp(
        createProxyMiddleware({
          target: `https://localhost:${targetPortA}`,
          secure: false,
          changeOrigin: true,
          router(req) {
            return { host: 'localhost', port: targetPortC, protocol: 'https:' };
          },
        }),
      );
      const agent = request(app);
      const response = await agent.get('/api').expect(200);
      expect(response.text).toBe('C');
    });

    it('should work with an async callback', async () => {
      const app = createApp(
        createProxyMiddleware({
          target: `https://localhost:${targetPortA}`,
          secure: false,
          changeOrigin: true,
          router: async (req) => {
            return new Promise((resolve) =>
              resolve({ host: 'localhost', port: targetPortC, protocol: 'https:' }),
            );
          },
        }),
      );

      const agent = request(app);
      const response = await agent.get('/api').expect(200);
      expect(response.text).toBe('C');
    });

    it('should handle promise rejection in router', async () => {
      const app = createApp(
        createProxyMiddleware({
          target: `https://localhost:${targetPortA}`,
          secure: false,
          changeOrigin: true,
          router: async (req) => {
            throw new Error('An error thrown in the router');
          },
        }),
      );
      const errorHandler: ErrorRequestHandler = (err: Error, req, res, next) => {
        res.status(502).send(err.message);
      };
      app.use(errorHandler);

      const agent = request(app);
      const response = await agent.get('/api').expect(502);
      expect(response.text).toBe('An error thrown in the router');
    });

    it('missing a : will cause it to use http', async () => {
      const app = createApp(
        createProxyMiddleware({
          target: `https://localhost:${targetPortA}`,
          secure: false,
          changeOrigin: true,
          router: async (req) => {
            return new Promise((resolve) =>
              resolve({ host: 'localhost', port: targetPortC, protocol: 'https' }),
            );
          },
        }),
      );

      const agent = request(app);
      const response = await agent.get('/api').expect(200);
      expect(response.text).toBe('NOT HTTPS C');
    });
  });

  describe('router with proxyTable', () => {
    let agent: TestAgent.Agent;

    beforeEach(() => {
      const app = createAppWithPath(
        '/',
        createProxyMiddleware({
          target: `https://localhost:${targetPortA}`,
          secure: false,
          changeOrigin: true,
          router: {
            'alpha.localhost:6000': `https://localhost:${targetPortA}`,
            'beta.localhost:6000': `https://localhost:${targetPortB}`,
            'localhost:6000/api': `https://localhost:${targetPortC}`,
          },
        }),
      );

      agent = request(app);
    });

    it('should proxy to option.target', async () => {
      const response = await agent.get('/api').expect(200);

      expect(response.text).toBe('A');
    });

    it('should proxy when host is "alpha.localhost"', async () => {
      const response = await agent.get('/api').set('host', 'alpha.localhost:6000').expect(200);

      expect(response.text).toBe('A');
    });

    it('should proxy when host is "beta.localhost"', async () => {
      const response = await agent.get('/api').set('host', 'beta.localhost:6000').expect(200);

      expect(response.text).toBe('B');
    });

    it('should proxy with host & path config: "localhost:6000/api"', async () => {
      const response = await agent.get('/api').set('host', 'localhost:6000').expect(200);

      expect(response.text).toBe('C');
    });
  });
});
