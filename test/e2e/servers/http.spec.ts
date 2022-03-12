import * as http from 'http';
import { createProxyMiddleware } from '../test-kit';
import { Options } from '../../../src/index';
import * as request from 'supertest';
import * as getPort from 'get-port';

describe('http integration', () => {
  let server: http.Server | null = null;

  afterEach(() => {
    server?.close();
  });

  it('should work with raw node http RequestHandler', async () => {
    await new Promise(async (resolve, reject) => {
      const port = await getPort();
      server = http
        .createServer((req, res) => {
          const proxyConfig: Options = {
            changeOrigin: true,
            logLevel: 'silent',
            target: 'http://jsonplaceholder.typicode.com',
          };
          const handler = createProxyMiddleware(proxyConfig);
          return handler(req, res, resolve);
        })
        .listen(port);
      request(server)
        .get('/')
        .expect(200)
        .end((err, res) => {
          if (err) {
            reject(err);
          } else {
            expect(res.ok).toBe(true);
            resolve(res);
          }
        });
    });
  });
});
