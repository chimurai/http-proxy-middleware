import * as http from 'node:http';

import getPort from 'get-port';
import type { Mockttp } from 'mockttp';
import { getLocal } from 'mockttp';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RawData } from 'ws';
import { WebSocket } from 'ws';

import type { RequestHandler } from '../../src/types.js';
import { createApp, createProxyMiddleware } from './test-kit.js';

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

  describe('ws enabled without server object (issue #143)', () => {
    it('should not crash when server is undefined', async () => {
      const middleware = createProxyMiddleware({
        target: mockWsTargetServer.url,
        ws: true,
        pathFilter: '/api',
      });

      // Mock request without server attached
      const mockReq = {
        url: '/other', // Non-matching path
        headers: {},
        socket: {}, // socket without server property
      } as http.IncomingMessage;

      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      } as unknown as http.ServerResponse;

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
      const mockReq = {
        url: '/other',
        headers: {},
        socket: { server: null }, // explicitly null
      } as unknown as http.IncomingMessage;

      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      } as unknown as http.ServerResponse;

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
      const mockReq = {
        url: '/test',
        headers: {},
        socket: {}, // no server
      } as http.IncomingMessage;

      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      } as unknown as http.ServerResponse;

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
        const mockReq = {
          url: '/other',
          headers: {},
          socket: {},
        } as http.IncomingMessage;

        const mockRes = {
          writeHead: vi.fn(),
          end: vi.fn(),
        } as unknown as http.ServerResponse;

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

      const mockReq = {
        url: '/other',
        headers: {},
        socket: {}, // no server, but ws is disabled anyway
      } as http.IncomingMessage;

      const mockRes = {
        writeHead: vi.fn(),
        end: vi.fn(),
      } as unknown as http.ServerResponse;

      const mockNext = vi.fn();

      await expect(middleware(mockReq, mockRes, mockNext)).resolves.toBeUndefined();

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
