import { createProxyMiddleware, responseInterceptor } from '../../src';
import { createApp } from './_utils';
import * as request from 'supertest';

describe('responseInterceptor()', () => {
  let agent: request.SuperTest<request.Test>;

  describe('intercept responses', () => {
    beforeEach(() => {
      agent = request(
        createApp(
          createProxyMiddleware({
            target: `http://httpbin.org`,
            changeOrigin: true, // for vhosted sites, changes host header to match to target's host
            selfHandleResponse: true,
            onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
              res.setHeader('content-type', 'application/json; charset=utf-8');
              return JSON.stringify({ foo: 'bar', favorite: '叉燒包' });
            }),
          })
        )
      );
    });

    it('should return totally different response from http://httpbin.org/json', async () => {
      const response = await agent.get(`/json`).expect(200);
      expect(response.body.foo).toEqual('bar');
    });

    it('should return totally different response from http://httpbin.org/image', async () => {
      const response = await agent
        .get(`/image`)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200);
      expect(response.body.foo).toEqual('bar');
    });

    it('should support double bytes characters http://httpbin.org/json', async () => {
      const response = await agent.get(`/json`).expect(200);
      expect(response.body.favorite).toEqual('叉燒包');
    });
  });

  describe('intercept compressed responses', () => {
    beforeEach(() => {
      agent = request(
        createApp(
          createProxyMiddleware({
            target: `http://httpbin.org`,
            changeOrigin: true, // for vhosted sites, changes host header to match to target's host
            selfHandleResponse: true,
            onProxyRes: responseInterceptor(async (buffer) => buffer),
          })
        )
      );
    });

    it('should return decompressed brotli response http://httpbin.org/brotli', async () => {
      const response = await agent.get(`/brotli`).expect(200);
      expect(response.body.brotli).toBe(true);
    });

    it('should return decompressed gzipped response from http://httpbin.org/gzip', async () => {
      const response = await agent.get(`/gzip`).expect(200);
      expect(response.body.gzipped).toBe(true);
    });

    it('should return decompressed deflated response from http://httpbin.org/deflate', async () => {
      const response = await agent.get(`/deflate`).expect(200);
      expect(response.body.deflated).toBe(true);
    });
  });
});
