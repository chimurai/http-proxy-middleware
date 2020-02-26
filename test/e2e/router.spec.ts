import { createProxyMiddleware, createApp, createAppWithPath } from './_utils';
import * as request from 'supertest';
import { getLocal, Mockttp } from 'mockttp';

describe('E2E router', () => {
  let targetServerA: Mockttp;
  let targetServerB: Mockttp;
  let targetServerC: Mockttp;

  beforeEach(async () => {
    targetServerA = getLocal();
    targetServerB = getLocal();
    targetServerC = getLocal();

    await targetServerA.start(6001);
    await targetServerB.start(6002);
    await targetServerC.start(6003);

    targetServerA.get().thenReply(200, 'A');
    targetServerB.get().thenReply(200, 'B');
    targetServerC.get().thenReply(200, 'C');
  });

  afterEach(async () => {
    await targetServerA.stop();
    await targetServerB.stop();
    await targetServerC.stop();
  });

  describe('router with proxyTable', () => {
    it('should proxy to: "localhost:6003/api"', async () => {
      const app = createApp(
        createProxyMiddleware({
          target: `http://localhost:6001`,
          router(req) {
            return 'http://localhost:6003';
          }
        })
      );

      const agent = request(app);
      const response = await agent.get('/api').expect(200);
      expect(response.text).toBe('C');
    });
  });

  describe('router with proxyTable', () => {
    let agent;

    beforeEach(() => {
      const app = createAppWithPath(
        '/',
        createProxyMiddleware({
          target: 'http://localhost:6001',
          router: {
            'alpha.localhost:6000': 'http://localhost:6001',
            'beta.localhost:6000': 'http://localhost:6002',
            'localhost:6000/api': 'http://localhost:6003'
          }
        })
      );

      agent = request(app);
    });

    it('should proxy to option.target', async () => {
      const response = await agent.get('/api').expect(200);

      expect(response.text).toBe('A');
    });

    it('should proxy when host is "alpha.localhost"', async () => {
      const response = await agent
        .get('/api')
        .set('host', 'alpha.localhost:6000')
        .expect(200);

      expect(response.text).toBe('A');
    });

    it('should proxy when host is "beta.localhost"', async () => {
      const response = await agent
        .get('/api')
        .set('host', 'beta.localhost:6000')
        .expect(200);

      expect(response.text).toBe('B');
    });

    it('should proxy with host & path config: "localhost:6000/api"', async () => {
      const response = await agent
        .get('/api')
        .set('host', 'localhost:6000')
        .expect(200);

      expect(response.text).toBe('C');
    });
  });
});
