import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createApp, createProxyMiddleware } from './test-kit.js';

/**
 * Why `followRedirects` is enabled in this file:
 * - keep parity with nock e2e behavior where buffered request flow avoids hangs in mocked-network tests.
 * - validates MSW compatibility under the same proxy execution path used in nock.spec.ts.
 */

describe('E2E msw', () => {
  const target = 'http://localhost:45678';
  const alternateTarget = 'http://localhost:45679';
  const server = setupServer();

  beforeEach(() => {
    // Supertest sends local loopback requests to the in-memory app; bypass those.
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterEach(() => {
    server.resetHandlers();
    server.close();
  });

  it('proxies GET requests to a msw mocked target', async () => {
    server.use(
      http.get(`${target}/api/hello`, () => {
        return new HttpResponse('hello from msw', { status: 200 });
      }),
    );

    const agent = request(
      createApp(
        createProxyMiddleware({
          target,
          pathFilter: '/api',
          // Keep msw-based e2e stable and aligned with nock e2e transport path.
          followRedirects: true,
        }),
      ),
    );

    const response = await agent.get('/api/hello').expect(200);

    expect(response.text).toBe('hello from msw');
  });

  it('forwards query string to the msw mocked target', async () => {
    server.use(
      http.get(`${target}/api/search`, ({ request }) => {
        const url = new URL(request.url);
        return HttpResponse.json(
          {
            ok: true,
            q: url.searchParams.get('q'),
            page: url.searchParams.get('page'),
          },
          { status: 200 },
        );
      }),
    );

    const agent = request(
      createApp(
        createProxyMiddleware({
          target,
          pathFilter: '/api',
          // Keep msw-based e2e stable and aligned with nock e2e transport path.
          followRedirects: true,
        }),
      ),
    );

    const response = await agent.get('/api/search?q=proxy&page=1').expect(200);

    expect(response.body).toEqual({ ok: true, q: 'proxy', page: '1' });
  });

  it('forwards JSON POST body to the msw mocked target', async () => {
    server.use(
      http.post(`${target}/api/users`, async ({ request }) => {
        const body = await request.json();
        return HttpResponse.json(
          {
            created: true,
            echoed: body,
          },
          { status: 201 },
        );
      }),
    );

    const agent = request(
      createApp(
        createProxyMiddleware({
          target,
          pathFilter: '/api',
          // Keep msw-based e2e stable and aligned with nock e2e transport path.
          followRedirects: true,
        }),
      ),
    );

    const response = await agent
      .post('/api/users')
      .send({ name: 'alice', role: 'admin' })
      .expect(201);

    expect(response.body).toEqual({
      created: true,
      echoed: { name: 'alice', role: 'admin' },
    });
  });

  it('supports router to re-target specific requests', async () => {
    server.use(
      http.get(`${alternateTarget}/api/router`, () => {
        return new HttpResponse('routed target', { status: 200 });
      }),
      http.get(`${target}/api/default`, () => {
        return new HttpResponse('default target', { status: 200 });
      }),
    );

    const agent = request(
      createApp(
        createProxyMiddleware({
          pathFilter: '/api',
          // Keep msw-based e2e stable and aligned with nock e2e transport path.
          followRedirects: true,
          router(req) {
            return req.url === '/api/router' ? alternateTarget : target;
          },
        }),
      ),
    );

    const routedResponse = await agent.get('/api/router').expect(200);
    const defaultResponse = await agent.get('/api/default').expect(200);

    expect(routedResponse.text).toBe('routed target');
    expect(defaultResponse.text).toBe('default target');
  });
});
