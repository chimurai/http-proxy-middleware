import * as http from 'node:http';
import type { Socket } from 'node:net';

import getPort from 'get-port';
import type { Mockttp } from 'mockttp';
import { getLocal } from 'mockttp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RawData } from 'ws';
import { WebSocket } from 'ws';

import type { RequestHandler } from '../../src/types.js';
import { createMockRequest, createMockResponse } from '../test-utils.js';
import { createApp, createAppWithPath, createProxyMiddleware } from './test-kit.js';

/********************************************************************
 * - Not possible to use `supertest` to test WebSockets
 * - Make sure to use different port for each test to avoid flakiness
 ********************************************************************/

describe('E2E WebSocket proxy', () => {
  let proxyServer: http.Server;
  let ws: WebSocket;
  let mockWsTargetServer: Mockttp;
  let proxyMiddleware: RequestHandler;
  let SERVER_PORT: number;

  beforeEach(async () => {
    mockWsTargetServer = getLocal();
    await mockWsTargetServer.start();
    await mockWsTargetServer.forAnyWebSocket().thenEcho();

    SERVER_PORT = await getPort();
  });

  beforeEach(() => {
    proxyMiddleware = createProxyMiddleware({
      target: mockWsTargetServer.url,
      ws: true,
      pathRewrite: { '^/socket': '' },
    });
  });

  const toWebSocketUrl = (url: string) => url.replace(/^http/, 'ws');

  const closeServer = (server?: http.Server) => {
    if (!server?.listening) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  };

  const closeWebSocketClient = (socket?: WebSocket) => {
    if (!socket || socket.readyState === WebSocket.CLOSED) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      socket.once('close', () => resolve());
      socket.once('error', () => resolve());

      if (socket.readyState === WebSocket.CONNECTING) {
        socket.terminate();
        return;
      }

      socket.close();
    });
  };

  const connectWebSocket = (url: string) => {
    return new Promise<void>((resolve, reject) => {
      ws = new WebSocket(url);
      ws.once('open', () => resolve());
      ws.once('error', reject);
    });
  };

  const receiveMessage = () => {
    return new Promise<string | RawData>((resolve) => {
      ws.once('message', (data, isBinary) => {
        const message = isBinary ? data : data.toString();
        resolve(message);
      });
    });
  };

  afterEach(async () => {
    await Promise.all([
      closeServer(proxyServer),
      closeWebSocketClient(ws),
      mockWsTargetServer.stop(),
    ]);
  });

  describe('option.ws', () => {
    beforeEach(async () => {
      proxyServer = createApp(proxyMiddleware).listen(SERVER_PORT);

      // quick & dirty Promise version of http.get (don't care about correctness)
      const get = async (uri: string) => new Promise((resolve, reject) => http.get(uri, resolve));

      // need to make a normal http request, so http-proxy-middleware can catch the upgrade request
      await get(`http://localhost:${SERVER_PORT}/`);
      // do a second http request to make sure only 1 listener subscribes to upgrade request
      await get(`http://localhost:${SERVER_PORT}/`);

      await connectWebSocket(`ws://localhost:${SERVER_PORT}/socket`);
    });

    it('should proxy to path', async () => {
      const messageReceived = receiveMessage();
      ws.send('foobar');

      await expect(messageReceived).resolves.toBe('foobar');
    });

    it('should forward websocket upgrade to /ws-path without duplicating the mounted path', async () => {
      const sockJsPort = await getPort();

      const sockJsTargetServer = getLocal();
      await sockJsTargetServer.start();
      // performs an initial regular HTTP GET request subscribe to server upgrade event internally.
      await sockJsTargetServer.forGet('/ws-path').thenReply(200, 'ok');
      const sockJsRule = await sockJsTargetServer.forAnyWebSocket().thenEcho();

      const sockJsMiddleware = createProxyMiddleware({
        target: `${sockJsTargetServer.url}`,
        ws: true,
      });

      const sockJsServer = createAppWithPath('/ws-path', sockJsMiddleware).listen(sockJsPort);

      await new Promise((resolve, reject) => {
        http.get(`http://localhost:${sockJsPort}/ws-path`, resolve).on('error', reject);
      });

      const sockJsClient = new WebSocket(`ws://localhost:${sockJsPort}/ws-path`);

      try {
        await new Promise<void>((resolve, reject) => {
          sockJsClient.once('open', () => resolve());
          sockJsClient.once('error', reject);
        });

        const seenRequests = await sockJsRule.getSeenRequests();
        expect(seenRequests).toHaveLength(1);
        const upstreamPathname = new URL(seenRequests[0].url).pathname;
        expect(upstreamPathname).toBe('/ws-path');
      } finally {
        await Promise.all([
          closeWebSocketClient(sockJsClient),
          closeServer(sockJsServer),
          sockJsTargetServer.stop(),
        ]);
      }
    });

    it('should proxy websocket upgrades for two mounted paths with separate targets', async () => {
      const serverPort = await getPort();

      const targetServerA = getLocal();
      const targetServerB = getLocal();
      await targetServerA.start();
      await targetServerB.start();
      await targetServerA.forGet('/ws-path-a').thenReply(200, 'ok');
      await targetServerB.forGet('/ws-path-b').thenReply(200, 'ok');
      await targetServerA.forAnyWebSocket().thenEcho();
      await targetServerB.forAnyWebSocket().thenEcho();

      const middlewareA = createProxyMiddleware({
        target: targetServerA.url,
        ws: true,
        // NOTE: when multiple ws middlewares share one server, scope each with pathFilter
        // so only the intended middleware handles a given upgrade request.
        pathFilter: '/ws-path-a',
      });

      const middlewareB = createProxyMiddleware({
        target: targetServerB.url,
        ws: true,
        pathFilter: '/ws-path-b',
      });

      const multiMountServer = createAppWithPath('/ws-path-a', middlewareA)
        .use('/ws-path-b', middlewareB)
        .listen(serverPort);

      const connectAndEcho = async (path: string, message: string) => {
        const socket = new WebSocket(`ws://localhost:${serverPort}${path}`);

        try {
          await new Promise<void>((resolve, reject) => {
            socket.once('open', () => resolve());
            socket.once('error', reject);
          });

          const echoed = new Promise<string>((resolve) => {
            socket.once('message', (data) => resolve(data.toString()));
          });

          socket.send(message);
          await expect(echoed).resolves.toBe(message);
        } finally {
          await closeWebSocketClient(socket);
        }
      };

      try {
        // NOTE: perform a normal HTTP request per mounted path first so each middleware
        // subscribes to the server upgrade event before the websocket connection starts.
        await new Promise((resolve, reject) => {
          http.get(`http://localhost:${serverPort}/ws-path-a`, resolve).on('error', reject);
        });

        await new Promise((resolve, reject) => {
          http.get(`http://localhost:${serverPort}/ws-path-b`, resolve).on('error', reject);
        });

        await connectAndEcho('/ws-path-a', 'from-a');
        await connectAndEcho('/ws-path-b', 'from-b');
      } finally {
        await Promise.all([
          closeServer(multiMountServer),
          targetServerA.stop(),
          targetServerB.stop(),
        ]);
      }
    });
  });

  describe('option.ws with external server "upgrade"', () => {
    beforeEach(async () => {
      proxyServer = createApp(proxyMiddleware).listen(SERVER_PORT);
      proxyServer.on('upgrade', proxyMiddleware.upgrade);

      await connectWebSocket(`ws://localhost:${SERVER_PORT}/socket`);
    });

    it('should proxy to path', async () => {
      const messageReceived = receiveMessage();
      ws.send('foobar');

      await expect(messageReceived).resolves.toBe('foobar');
    });
  });

  describe('option.ws across multiple servers', () => {
    it('should proxy websocket upgrades on every attached server', async () => {
      const serverPortA = await getPort();
      const serverPortB = await getPort();

      const proxyServerA = createApp(proxyMiddleware).listen(serverPortA);
      const proxyServerB = createApp(proxyMiddleware).listen(serverPortB);

      const connectWebSocketWithTimeout = (url: string) => {
        return new Promise<void>((resolve, reject) => {
          const socket = new WebSocket(url);
          const timeout = setTimeout(() => {
            socket.terminate();
            reject(new Error(`Timed out connecting to ${url}`));
          }, 2000);

          socket.once('open', () => {
            clearTimeout(timeout);
            socket.close();
            resolve();
          });

          socket.once('error', (error) => {
            clearTimeout(timeout);
            reject(error);
          });
        });
      };

      try {
        await new Promise((resolve, reject) => {
          http.get(`http://localhost:${serverPortA}/`, resolve).on('error', reject);
        });

        await new Promise((resolve, reject) => {
          http.get(`http://localhost:${serverPortB}/`, resolve).on('error', reject);
        });

        await expect(
          connectWebSocketWithTimeout(`ws://localhost:${serverPortA}/socket`),
        ).resolves.toBeUndefined();
        await expect(
          connectWebSocketWithTimeout(`ws://localhost:${serverPortB}/socket`),
        ).resolves.toBeUndefined();
      } finally {
        await Promise.all([closeServer(proxyServerA), closeServer(proxyServerB)]);
      }
    });
  });

  describe('with router and pathRewrite', () => {
    beforeEach(() => {
      const proxyMiddleware = createProxyMiddleware({
        // cSpell:ignore notworkinghost
        target: 'ws://notworkinghost:6789',
        router: { '/socket': toWebSocketUrl(mockWsTargetServer.url) },
        pathRewrite: { '^/socket': '' },
      });

      proxyServer = createApp(proxyMiddleware).listen(SERVER_PORT);

      proxyServer.on('upgrade', proxyMiddleware.upgrade);
    });

    beforeEach(async () => {
      await connectWebSocket(`ws://localhost:${SERVER_PORT}/socket`);
    });

    it('should proxy to path', async () => {
      const messageReceived = receiveMessage();
      ws.send('foobar');

      await expect(messageReceived).resolves.toBe('foobar');
    });
  });

  describe('with error in router', () => {
    beforeEach(() => {
      const proxyMiddleware = createProxyMiddleware({
        // cSpell:ignore notworkinghost
        target: `http://notworkinghost:6789`,
        router: async () => {
          throw new Error('error');
        },
      });

      proxyServer = createApp(proxyMiddleware).listen(SERVER_PORT);

      proxyServer.on('upgrade', proxyMiddleware.upgrade);
    });

    it('should handle error', async () => {
      await new Promise<void>((resolve) => {
        ws = new WebSocket(`ws://localhost:${SERVER_PORT}/socket`);

        ws.once('error', (err) => {
          expect(err).toBeTruthy();
          resolve();
        });
      });
    });
  });

  describe('with unreachable websocket target', () => {
    it('should call on.error when proxy.ws rejects', async () => {
      // getPort returns a free port number; because nothing is started there,
      // connecting to this ws target fails and proxy.ws rejects.
      const unreachablePort = await getPort();
      const onError = vi.fn((err, req, socket) => {
        // Ensure hanging sockets are cleaned up in case the client does not close itself.
        (socket as Socket).destroy();
      });

      const middleware = createProxyMiddleware({
        target: `ws://127.0.0.1:${unreachablePort}`,
        ws: true,
        on: {
          error: onError,
        },
      });

      proxyServer = createApp(middleware).listen(SERVER_PORT);
      proxyServer.on('upgrade', middleware.upgrade);

      await new Promise<void>((resolve) => {
        ws = new WebSocket(`ws://localhost:${SERVER_PORT}/socket`);
        ws.once('error', () => resolve());
        ws.once('open', () => {
          ws.close();
          resolve();
        });
      });

      expect(onError).toHaveBeenCalledTimes(1);
      const [err, req, socket] = onError.mock.calls[0];
      expect(err).toBeTruthy();
      expect(req.url).toBe('/socket');
      expect(socket).toBeTruthy();
    });
  });

  describe('ws enabled without server object (issue #143)', () => {
    it('should not crash when server is undefined', async () => {
      const middleware = createProxyMiddleware({
        target: mockWsTargetServer.url,
        ws: true,
        pathFilter: '/api',
      });

      // Mock request without server attached
      const mockReq = createMockRequest({
        url: '/other', // Non-matching path
        headers: {},
        socket: {} as unknown as Socket, // socket without server property
      });

      const mockRes = createMockResponse();

      const mockNext = vi.fn();

      // Should not throw TypeError
      await expect(middleware(mockReq, mockRes, mockNext)).resolves.toBeUndefined();

      expect(mockNext).toHaveBeenCalled();
    });

    it('should still work when server is available', async () => {
      proxyServer = createApp(proxyMiddleware).listen(SERVER_PORT);

      // Make HTTP request first
      await new Promise((resolve) => http.get(`http://localhost:${SERVER_PORT}/`, resolve));

      // WebSocket should work normally
      await new Promise<void>((resolve, reject) => {
        ws = new WebSocket(`ws://localhost:${SERVER_PORT}/socket`);
        ws.on('open', () => resolve());
        ws.on('error', reject);
      });

      const messageReceived = new Promise<string>((resolve) => {
        ws.on('message', (data) => resolve(data.toString()));
      });

      ws.send('test-message');
      const response = await messageReceived;
      expect(response).toBe('test-message');
    });

    it('should not crash when server is null', async () => {
      const middleware = createProxyMiddleware({
        target: mockWsTargetServer.url,
        ws: true,
        pathFilter: '/api',
      });

      // Mock request with null server
      const mockReq = createMockRequest({
        url: '/other',
        headers: {},
        socket: { server: null } as unknown as Socket, // explicitly null
      });

      const mockRes = createMockResponse();

      const mockNext = vi.fn();

      await expect(middleware(mockReq, mockRes, mockNext)).resolves.toBeUndefined();

      expect(mockNext).toHaveBeenCalled();
    });

    it('should not crash on matching path with undefined server', async () => {
      const middleware = createProxyMiddleware({
        target: mockWsTargetServer.url,
        ws: true,
        pathFilter: '/api', // Will not match '/test'
      });

      // Mock request with path that won't match
      const mockReq = createMockRequest({
        url: '/test',
        headers: {},
        socket: {} as unknown as Socket, // no server
      });

      const mockRes = createMockResponse();

      const mockNext = vi.fn();

      // Should not throw
      await expect(middleware(mockReq, mockRes, mockNext)).resolves.toBeUndefined();

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle multiple requests with missing server', async () => {
      const middleware = createProxyMiddleware({
        target: mockWsTargetServer.url,
        ws: true,
        pathFilter: '/api',
      });

      const mockNext = vi.fn();

      // Multiple requests without server
      for (let i = 0; i < 3; i++) {
        const mockReq = createMockRequest({
          url: '/other',
          headers: {},
          socket: {} as unknown as Socket,
        });

        const mockRes = createMockResponse();

        await expect(middleware(mockReq, mockRes, mockNext)).resolves.toBeUndefined();
      }

      expect(mockNext).toHaveBeenCalledTimes(3);
    });

    it('should handle ws:false with missing server', async () => {
      const middleware = createProxyMiddleware({
        target: mockWsTargetServer.url,
        ws: false, // ws disabled
        pathFilter: '/api',
      });

      const mockReq = createMockRequest({
        url: '/other',
        headers: {},
        socket: {} as unknown as Socket, // no server, but ws is disabled anyway
      });

      const mockRes = createMockResponse();

      const mockNext = vi.fn();

      await expect(middleware(mockReq, mockRes, mockNext)).resolves.toBeUndefined();

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
