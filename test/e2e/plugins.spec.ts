import { createProxyMiddleware, createApp } from './test-kit';
import * as request from 'supertest';
import { getLocal, Mockttp } from 'mockttp';
import type { Options, Plugin } from '../../src/types';

describe('E2E Plugins', () => {
  let mockTargetServer: Mockttp;

  beforeEach(async () => {
    mockTargetServer = getLocal();
    await mockTargetServer.start();
  });

  afterEach(async () => {
    await mockTargetServer.stop();
  });

  it('should register a plugin and access the http-proxy object', async () => {
    let proxyReqUrl: string;
    let responseStatusCode: number;

    mockTargetServer.forGet('/users/1').thenReply(200, '{"userName":"John"}');

    const simplePlugin: Plugin = (proxy) => {
      proxy.on('proxyReq', (proxyReq, req, res, options) => (proxyReqUrl = req.url));
      proxy.on('proxyRes', (proxyRes, req, res) => (responseStatusCode = proxyRes.statusCode));
    };

    const config: Options = {
      target: `http://localhost:${mockTargetServer.port}`,
      plugins: [simplePlugin], // register a plugin
    };
    const proxyMiddleware = createProxyMiddleware(config);
    const app = createApp(proxyMiddleware);
    const agent = request(app);

    const response = await agent.get('/users/1').expect(200);

    expect(proxyReqUrl).toBe('/users/1');
    expect(response.text).toBe('{"userName":"John"}');
    expect(responseStatusCode).toBe(200);
  });
});
