import * as http from 'node:http';

import * as request from 'supertest';

import { createProxyMiddleware } from './test-kit';

describe('http integration', () => {
  it('should work with raw node http RequestHandler', async () => {
    const handler = createProxyMiddleware({
      changeOrigin: true,
      target: 'http://httpbin.org',
    });

    const server = http.createServer(handler);
    const response = await request(server).get('/get').expect(200);

    expect(response.ok).toBe(true);
    expect(response.body.url).toBe('http://httpbin.org/get');
  });
});
