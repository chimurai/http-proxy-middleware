import { createApp, createProxyMiddleware } from './test-kit';
import * as request from 'supertest';

describe('express error middleware', () => {
  it('should propagate error to express', async () => {
    let httpProxyError: Error | undefined;

    const proxyMiddleware = createProxyMiddleware({
      changeOrigin: true,
      router: (req) => undefined, // Trigger "Error: Must provide a proper URL as target"
    });

    const errorMiddleware = (err, req, res, next) => {
      httpProxyError = err;
      res.status(504).send('Something broke!');
    };

    const app = createApp(proxyMiddleware, errorMiddleware);
    const response = await request(app).get('/get').expect(504);

    expect(httpProxyError?.message).toBe('Must provide a proper URL as target');
    expect(response.text).toBe('Something broke!');
  });
});
