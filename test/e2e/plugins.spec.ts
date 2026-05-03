import type { Mockttp } from 'mockttp';
import { getLocal } from 'mockttp';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Options, Plugin } from '../../src/types.js';
import { createApp, createProxyMiddleware } from './test-kit.js';

describe('E2E Plugins', () => {
  let mockTargetServer: Mockttp;

  beforeEach(async () => {
    mockTargetServer = getLocal();
    await mockTargetServer.start();
  });

  afterEach(async () => {
    await mockTargetServer.stop();
  });

  it('should register a plugin and access the `httpxy` object', async () => {
    let proxyReqUrl: string | undefined;
    let responseStatusCode: number | undefined;

    mockTargetServer.forGet('/users/1').thenReply(200, '{"userName":"John"}');

    const simplePlugin: Plugin = (proxy) => {
      proxy.on('proxyReq', (proxyReq, req, res, options) => (proxyReqUrl = req.url));
      proxy.on('proxyRes', (proxyRes, req, res) => (responseStatusCode = proxyRes.statusCode));
    };

    const config: Options = {
      target: mockTargetServer.url,
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
