import nock from 'nock';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createApp, createProxyMiddleware } from './test-kit.js';

/**
 * Why `followRedirects` is enabled in this file:
 * - nock intercepts mocked outbound HTTP calls, but the default socket-connect piping path can hang
 *   in this test setup because the expected connect timing differs from real network sockets.
 * - enabling `followRedirects` switches proxying to the buffered request flow, which works reliably
 *   with nock and keeps these e2e assertions deterministic.
 */

describe('E2E nock', () => {
  const target = 'http://localhost:45678';
  const alternateTarget = 'http://localhost:45679';

  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    expect(nock.isDone()).toBe(true);
    nock.cleanAll();
  });

  it('proxies GET requests to a nock mocked target', async () => {
    const agent = request(
      createApp(
        createProxyMiddleware({
          target,
          pathFilter: '/api',
          // Keep nock-based e2e stable: avoid the default socket-connect piping path.
          followRedirects: true,
        }),
      ),
    );

    nock(target).get('/api/hello').reply(200, 'hello from nock');

    const response = await agent.get('/api/hello').expect(200);

    expect(response.text).toBe('hello from nock');
  });

  it('forwards query string to the nock mocked target', async () => {
    const agent = request(
      createApp(
        createProxyMiddleware({
          target,
          pathFilter: '/api',
          // Keep nock-based e2e stable: avoid the default socket-connect piping path.
          followRedirects: true,
        }),
      ),
    );

    nock(target).get('/api/search').query({ q: 'proxy', page: '1' }).reply(200, { ok: true });

    const response = await agent.get('/api/search?q=proxy&page=1').expect(200);

    expect(response.body).toEqual({ ok: true });
  });

  it('forwards JSON POST body to the nock mocked target', async () => {
    const agent = request(
      createApp(
        createProxyMiddleware({
          target,
          pathFilter: '/api',
          // Keep nock-based e2e stable: avoid the default socket-connect piping path.
          followRedirects: true,
        }),
      ),
    );

    nock(target)
      .post('/api/users', { name: 'alice', role: 'admin' })
      .reply(201, { created: true }, { 'content-type': 'application/json' });

    const response = await agent
      .post('/api/users')
      .send({ name: 'alice', role: 'admin' })
      .expect(201);

    expect(response.body).toEqual({ created: true });
  });

  it('supports router to re-target specific requests', async () => {
    const agent = request(
      createApp(
        createProxyMiddleware({
          pathFilter: '/api',
          // Keep nock-based e2e stable: avoid the default socket-connect piping path.
          followRedirects: true,
          router(req) {
            return req.url === '/api/router' ? alternateTarget : target;
          },
        }),
      ),
    );

    nock(alternateTarget).get('/api/router').reply(200, 'routed target');
    nock(target).get('/api/default').reply(200, 'default target');

    const routedResponse = await agent.get('/api/router').expect(200);
    const defaultResponse = await agent.get('/api/default').expect(200);

    expect(routedResponse.text).toBe('routed target');
    expect(defaultResponse.text).toBe('default target');
  });
});
