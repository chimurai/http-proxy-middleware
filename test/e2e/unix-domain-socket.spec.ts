import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import { createApp, createProxyMiddleware } from './test-kit.js';

// E2E test of: https://github.com/chimurai/http-proxy-middleware/issues/434#issuecomment-1172896375

describe('E2E Unix Domain Socket proxy (UDS, or IPC sockets)', () => {
  const startTargetServer = async (socketPath: string) => {
    const app = express();
    app.get('/hello', (req, res) => {
      res.status(200).json({ ok: true });
    });

    const targetServer = app.listen(socketPath);
    await once(targetServer, 'listening');

    return {
      async [Symbol.asyncDispose]() {
        await new Promise<void>((resolve, reject) => {
          targetServer.close((error) => (error ? reject(error) : resolve()));
        });
      },
    };
  };

  const startProxyServer = async (socketPath: string) => {
    const proxyMiddleware = createProxyMiddleware({
      target: {
        socketPath,
      },
    });

    const proxyServer = createApp(proxyMiddleware).listen(0);
    await once(proxyServer, 'listening');

    return {
      server: proxyServer,
      async [Symbol.asyncDispose]() {
        await new Promise<void>((resolve, reject) => {
          proxyServer.close((error) => (error ? reject(error) : resolve()));
        });
      },
    };
  };

  it('proxies HTTP request to unix socket target', async () => {
    // ARRANGE
    const UNIX_DOMAIN_SOCKET_PATH = join(tmpdir(), `hpm-test-app-${randomUUID()}.sock`);

    await using targetServer = await startTargetServer(UNIX_DOMAIN_SOCKET_PATH);
    await using proxyServer = await startProxyServer(UNIX_DOMAIN_SOCKET_PATH);

    void targetServer;

    // ACT
    const response = await request(proxyServer.server).get('/hello').expect(200);

    // ASSERT
    expect(response.body).toEqual({ ok: true });
  });
});
