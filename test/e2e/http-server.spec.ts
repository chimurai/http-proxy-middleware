import * as http from 'node:http';

import type { Mockttp } from 'mockttp';
import { getLocal } from 'mockttp';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createProxyMiddleware } from './test-kit.js';

describe('http integration', () => {
  let targetServer: Mockttp;

  beforeEach(async () => {
    targetServer = getLocal();
    await targetServer.start();
  });

  afterEach(async () => {
    await targetServer.stop();
  });

  it('should work with raw node http RequestHandler', async () => {
    await targetServer
      .forGet('/get')
      .thenReply(200, JSON.stringify({ url: `${targetServer.url}/get` }), {
        'content-type': 'application/json',
      });

    const handler = createProxyMiddleware({
      changeOrigin: true,
      target: targetServer.url,
    });

    const server = http.createServer(handler);
    const response = await request(server).get('/get').expect(200);

    expect(response.ok).toBe(true);
    expect(response.body.url).toBe(`${targetServer.url}/get`);
  });
});
