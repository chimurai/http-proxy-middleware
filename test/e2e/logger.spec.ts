import { format } from 'node:util';

import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

import type { Logger } from '../../src/types.js';
import { createApp, createProxyMiddleware } from './test-kit.js';

describe('logger', () => {
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
