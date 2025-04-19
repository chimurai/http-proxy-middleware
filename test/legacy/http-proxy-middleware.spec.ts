import { Mockttp, getLocal } from 'mockttp';
import * as request from 'supertest';

import { LegacyOptions, legacyCreateProxyMiddleware } from '../../src';
import { createApp, createAppWithPath } from '../e2e/test-kit';

describe('legacyCreateProxyMiddleware()', () => {
  const mockServer: Mockttp = getLocal();

  beforeEach(() => mockServer.start());
  afterEach(() => mockServer.stop());

  it('should throw when short hand is used', () => {
    expect(() => legacyCreateProxyMiddleware(`http://localhost:${mockServer.port}`))
      .toThrowErrorMatchingInlineSnapshot(`
      "Shorthand syntax is removed from legacyCreateProxyMiddleware().
            Please use "legacyCreateProxyMiddleware({ target: 'http://www.example.org' })" instead.

            More details: https://github.com/chimurai/http-proxy-middleware/blob/master/MIGRATION.md#removed-shorthand-usage
            "
    `);
  });

  it('should expose external websocket upgrade handler', () => {
    const proxyMiddleware = legacyCreateProxyMiddleware({
      target: `http://localhost:${mockServer.port}`,
    });
    expect(proxyMiddleware.upgrade).toBeDefined();
  });

  it('should proxy to /users', async () => {
    mockServer.forGet('/users').thenReply(200, 'legacy OK');

    const proxyMiddleware = legacyCreateProxyMiddleware({
      target: `http://localhost:${mockServer.port}`,
    });

    const app = createApp(proxyMiddleware);
    const response = await request(app).get('/users').expect(200);

    expect(response.text).toBe('legacy OK');
  });

  it('should proxy with old context option', async () => {
    mockServer.forGet('/admin/users').thenReply(200, 'legacy OK');

    const proxyMiddleware = legacyCreateProxyMiddleware('/admin', {
      target: `http://localhost:${mockServer.port}`,
    });

    const app = createApp(proxyMiddleware);
    const response = await request(app).get('/admin/users').expect(200);

    expect(response.text).toBe('legacy OK');
  });

  it('should proxy to /users with legacy patched req.url behavior', async () => {
    mockServer.forGet('/users').thenReply(200, 'legacy OK');

    const proxyMiddleware = legacyCreateProxyMiddleware({
      target: `http://localhost:${mockServer.port}`,
    });

    const app = createAppWithPath('/users', proxyMiddleware);
    const response = await request(app).get('/users').expect(200);

    expect(response.text).toBe('legacy OK');
  });

  it('should fail to proxy to /users with legacy patched req.url behavior', async () => {
    mockServer.forGet('/users').thenReply(200, 'legacy OK');

    const proxyMiddleware = legacyCreateProxyMiddleware({
      target: `http://localhost:${mockServer.port}/users`,
    });

    const app = createAppWithPath('/users', proxyMiddleware);
    await request(app).get('/users').expect(503);
  });

  it('should respond with legacy onError handler and log error', async () => {
    mockServer.forGet('/users').thenCloseConnection();

    const mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    const legacyOptions: LegacyOptions = {
      target: `http://localhost:${mockServer.port}`,
      logLevel: 'error',
      logProvider: () => mockLogger,
      onError(err, req, res) {
        res.status(500).send('my legacy error');
      },
    };

    const proxyMiddleware = legacyCreateProxyMiddleware(legacyOptions);

    const app = createAppWithPath('/users', proxyMiddleware);
    const response = await request(app).get('/users').expect(500);

    expect(response.text).toBe('my legacy error');

    expect(mockLogger.error).toHaveBeenCalledTimes(1);
    expect(mockLogger.warn).toHaveBeenCalledTimes(2);
  });
});
