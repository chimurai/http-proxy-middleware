import zlib from 'node:zlib';

import type { Mockttp } from 'mockttp';
import { getLocal } from 'mockttp';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createProxyMiddleware, responseInterceptor } from '../../src/index.js';
import { createApp } from './test-kit.js';

describe('responseInterceptor()', () => {
  let agent: request.Agent;
  let targetServer: Mockttp;

  beforeEach(async () => {
    targetServer = getLocal();
    await targetServer.start();
  });

  afterEach(async () => {
    await targetServer.stop();
  });

  describe('intercept responses', () => {
    beforeEach(async () => {
      await targetServer.forGet('/json').thenReply(200, JSON.stringify({ source: 'json' }), {
        'content-type': 'application/json; charset=utf-8',
      });

      await targetServer.forGet('/image').thenReply(200, 'PNG', {
        'content-type': 'image/png',
      });

      await targetServer
        .forGet('/response-headers')
        .withExactQuery('?Trailer=X-Stream-Error&Host=localhost')
        .thenReply(200, '', {
          'transfer-encoding': 'chunked',
          trailer: 'X-Stream-Error',
          host: 'localhost',
        });

      agent = request(
        createApp(
          createProxyMiddleware({
            target: targetServer.url,
            changeOrigin: true, // for vhosted sites, changes host header to match to target's host
            selfHandleResponse: true,
            on: {
              proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
                res.setHeader('content-type', 'application/json; charset=utf-8');
                return JSON.stringify({ foo: 'bar', favorite: '叉燒包' });
              }),
            },
          }),
        ),
      );
    });

    it('should return totally different response from target /json', async () => {
      const response = await agent.get(`/json`).expect(200);
      expect(response.body.foo).toEqual('bar');
    });

    it('should return totally different response from target /image', async () => {
      const response = await agent
        .get(`/image`)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(200);
      expect(response.body.foo).toEqual('bar');
    });

    it('should support double bytes characters for /json', async () => {
      const response = await agent.get(`/json`).expect(200);
      expect(response.body.favorite).toEqual('叉燒包');
    });

    it('should not contains disallow headers to trailer in response headers', async () => {
      const response = await agent
        .get('/response-headers?Trailer=X-Stream-Error&Host=localhost')
        .expect(200);
      expect(response.header['host']).toBeUndefined();
    });
  });

  describe('intercept responses with original headers', () => {
    beforeEach(async () => {
      await targetServer.forGet('/cookies/set/cookie/monster').thenReply(302, '', {
        'access-control-allow-origin': '*',
        date: new Date().toUTCString(),
        'set-cookie': 'cookie=monster; Path=/',
      });

      agent = request(
        createApp(
          createProxyMiddleware({
            target: targetServer.url,
            changeOrigin: true, // for vhosted sites, changes host header to match to target's host
            selfHandleResponse: true,
            on: {
              proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
                return responseBuffer;
              }),
            },
          }),
        ),
      );
    });

    it('should proxy and return original headers from /cookies/set/cookie/monster', async () => {
      return agent
        .get(`/cookies/set/cookie/monster`)
        .expect('Access-Control-Allow-Origin', '*')
        .expect('Date', /.+/)
        .expect('set-cookie', /.*cookie=monster.*/)
        .expect(302);
    });
  });

  describe('intercept compressed responses', () => {
    beforeEach(async () => {
      await targetServer
        .forGet('/brotli')
        .thenReply(
          200,
          zlib.brotliCompressSync(Buffer.from(JSON.stringify({ brotli: true }), 'utf8')),
          {
            'content-encoding': 'br',
            'content-type': 'application/json; charset=utf-8',
          },
        );

      await targetServer
        .forGet('/gzip')
        .thenReply(200, zlib.gzipSync(Buffer.from(JSON.stringify({ gzipped: true }), 'utf8')), {
          'content-encoding': 'gzip',
          'content-type': 'application/json; charset=utf-8',
        });

      await targetServer
        .forGet('/deflate')
        .thenReply(200, zlib.deflateSync(Buffer.from(JSON.stringify({ deflated: true }), 'utf8')), {
          'content-encoding': 'deflate',
          'content-type': 'application/json; charset=utf-8',
        });

      agent = request(
        createApp(
          createProxyMiddleware({
            target: targetServer.url,
            changeOrigin: true, // for vhosted sites, changes host header to match to target's host
            selfHandleResponse: true,
            on: {
              proxyRes: responseInterceptor(async (buffer) => buffer),
            },
          }),
        ),
      );
    });

    it('should return decompressed brotli response /brotli', async () => {
      const response = await agent.get(`/brotli`).expect(200);
      expect(response.body.brotli).toBe(true);
    });

    it('should return decompressed gzipped response from /gzip', async () => {
      const response = await agent.get(`/gzip`).expect(200);
      expect(response.body.gzipped).toBe(true);
    });

    it('should return decompressed deflated response from /deflate', async () => {
      const response = await agent.get(`/deflate`).expect(200);
      expect(response.body.deflated).toBe(true);
    });
  });
});
