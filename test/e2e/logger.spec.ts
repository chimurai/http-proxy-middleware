import { format } from 'node:util';

import type { Mockttp } from 'mockttp';
import { getLocal } from 'mockttp';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Logger } from '../../src/types.js';
import { createApp, createProxyMiddleware } from './test-kit.js';

describe('logger', () => {
  let targetServer: Mockttp;

  beforeEach(async () => {
    targetServer = getLocal();
    await targetServer.start();
  });

  afterEach(async () => {
    await targetServer.stop();
  });

  it('should log ipv4 target with port', async () => {
    await targetServer.forGet('/api').thenReply(200, 'OK');

    const logger: Logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const proxy = createProxyMiddleware({
      changeOrigin: true,
      target: `http://127.0.0.1:${targetServer.port}`,
      logger,
    });

    await request(createApp(proxy)).get('/api').expect(200, 'OK');

    expect(logger.info).toHaveBeenCalledWith(
      `[HPM] GET /api -> http://127.0.0.1:${targetServer.port}/api [200]`,
    );
  });

  it('should log target ENOTFOUND errors', async () => {
    const logger: Logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const agent = request(
      createApp(
        createProxyMiddleware({
          target: 'http://does-not-exist.invalid',
          logger,
        }),
      ),
    );

    await agent.get('/my-path').set('Host', 'example.test').expect(504);

    expect(logger.error).toHaveBeenCalledTimes(1);

    const [message, requestHref, targetHref, errorCode, errorReference] = vi.mocked(logger.error)
      .mock.calls[0];

    expect(
      format(message, requestHref, targetHref, errorCode, errorReference),
    ).toMatchInlineSnapshot(
      `"[HPM] Error occurred while proxying request example.test/my-path to http://does-not-exist.invalid/ [ENOTFOUND] (https://nodejs.org/api/errors.html#errors_common_system_errors)"`,
    );
  });
});
