import * as http from 'http';
import { createProxyMiddleware } from './test-kit';
import * as request from 'supertest';

describe('http integration', () => {
  it('should work with raw node http RequestHandler', async () => {
    const handler = createProxyMiddleware({
      changeOrigin: true,
      logLevel: 'silent',
      target: 'http://httpbin.org',
    });

    const server = http.createServer(handler);
    const response = await request(server).get('/get').expect(200);

    expect(response.ok).toBe(true);
    expect(response.body.url).toBe('http://httpbin.org/get');
  });
});
