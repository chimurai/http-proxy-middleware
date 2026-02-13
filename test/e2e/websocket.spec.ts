import * as http from 'node:http';

import * as getPort from 'get-port';
import { WebSocket, WebSocketServer } from 'ws';

import type { RequestHandler } from '../../src/types';
import { createApp, createProxyMiddleware } from './test-kit';

/********************************************************************
 * - Not possible to use `supertest` to test WebSockets
 * - Make sure to use different port for each test to avoid flakiness
 ********************************************************************/

describe('E2E WebSocket proxy', () => {
  let proxyServer: http.Server;
  let ws: WebSocket;
  let wss: WebSocketServer;
  let proxyMiddleware: RequestHandler;
  let WS_SERVER_PORT: number;
  let SERVER_PORT: number;

  beforeEach(async () => {
    WS_SERVER_PORT = await getPort();
    SERVER_PORT = await getPort();

    wss = new WebSocketServer({ port: WS_SERVER_PORT });

    wss.on('connection', (websocket) => {
      websocket.on('message', (data, isBinary) => {
        const message = isBinary ? data : data.toString();
        websocket.send(message); // echo received message
      });
    });
  });

  beforeEach(() => {
    proxyMiddleware = createProxyMiddleware({
      target: `http://localhost:${WS_SERVER_PORT}`,
      ws: true,
      pathRewrite: { '^/socket': '' },
    });
  });

  afterEach(async () => {
    return Promise.all([
      new Promise((resolve) => proxyServer.close(resolve)),
      new Promise((resolve) => wss.close(resolve)),
      new Promise((resolve) => resolve(ws.close())),
    ]);
  });

  describe('option.ws', () => {
    beforeEach(async () => {
      proxyServer = createApp(proxyMiddleware).listen(SERVER_PORT);

      // quick & dirty Promise version of http.get (don't care about correctness)
      const get = async (uri) => new Promise((resolve, reject) => http.get(uri, resolve));

      // need to make a normal http request, so http-proxy-middleware can catch the upgrade request
      await get(`http://localhost:${SERVER_PORT}/`);
      // do a second http request to make sure only 1 listener subscribes to upgrade request
      await get(`http://localhost:${SERVER_PORT}/`);

      return new Promise((resolve) => {
        ws = new WebSocket(`ws://localhost:${SERVER_PORT}/socket`);
        ws.on('open', resolve);
      });
    });

    it('should proxy to path', (done) => {
      ws.on('message', (data, isBinary) => {
        const message = isBinary ? data : data.toString();
        expect(message).toBe('foobar');
        done();
      });
      ws.send('foobar');
    });
  });

  describe('option.ws with external server "upgrade"', () => {
    beforeEach((done) => {
      proxyServer = createApp(proxyMiddleware).listen(SERVER_PORT);
      proxyServer.on('upgrade', proxyMiddleware.upgrade);

      ws = new WebSocket(`ws://localhost:${SERVER_PORT}/socket`);
      ws.on('open', done);
    });

    it('should proxy to path', (done) => {
      ws.on('message', (data, isBinary) => {
        const message = isBinary ? data : data.toString();
        expect(message).toBe('foobar');
        done();
      });
      ws.send('foobar');
    });
  });

  describe('with router and pathRewrite', () => {
    beforeEach(() => {
      const proxyMiddleware = createProxyMiddleware({
        // cSpell:ignore notworkinghost
        target: 'ws://notworkinghost:6789',
        router: { '/socket': `ws://localhost:${WS_SERVER_PORT}` },
        pathRewrite: { '^/socket': '' },
      });

      proxyServer = createApp(proxyMiddleware).listen(SERVER_PORT);

      proxyServer.on('upgrade', proxyMiddleware.upgrade);
    });

    beforeEach((done) => {
      ws = new WebSocket(`ws://localhost:${SERVER_PORT}/socket`);
      ws.on('open', done);
    });

    it('should proxy to path', (done) => {
      ws.on('message', (data, isBinary) => {
        const message = isBinary ? data : data.toString();
        expect(message).toBe('foobar');
        done();
      });
      ws.send('foobar');
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

    it('should handle error', (done) => {
      ws = new WebSocket(`ws://localhost:${SERVER_PORT}/socket`);

      ws.on('error', (err) => {
        expect(err).toBeTruthy();
        done();
      });
    });
  });

  describe('ws enabled without server object (issue #143)', () => {
    it('should not crash when server is undefined', async () => {
      const middleware = createProxyMiddleware({
        target: `http://localhost:${WS_SERVER_PORT}`,
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
        writeHead: jest.fn(),
        end: jest.fn(),
      } as unknown as http.ServerResponse;

      const mockNext = jest.fn();

      // Should not throw TypeError
      await expect(async () => {
        await middleware(mockReq, mockRes, mockNext);
      }).resolves.not.toThrow();

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
        target: `http://localhost:${WS_SERVER_PORT}`,
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
        writeHead: jest.fn(),
        end: jest.fn(),
      } as unknown as http.ServerResponse;

      const mockNext = jest.fn();

      await expect(async () => {
        await middleware(mockReq, mockRes, mockNext);
      }).resolves.not.toThrow();

      expect(mockNext).toHaveBeenCalled();
    });

    it('should not crash on matching path with undefined server', async () => {
      const middleware = createProxyMiddleware({
        target: `http://localhost:${WS_SERVER_PORT}`,
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
        writeHead: jest.fn(),
        end: jest.fn(),
      } as unknown as http.ServerResponse;

      const mockNext = jest.fn();

      // Should not throw
      await expect(async () => {
        await middleware(mockReq, mockRes, mockNext);
      }).resolves.not.toThrow();

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle multiple requests with missing server', async () => {
      const middleware = createProxyMiddleware({
        target: `http://localhost:${WS_SERVER_PORT}`,
        ws: true,
        pathFilter: '/api',
      });

      const mockNext = jest.fn();

      // Multiple requests without server
      for (let i = 0; i < 3; i++) {
        const mockReq = {
          url: '/other',
          headers: {},
          socket: {},
        } as http.IncomingMessage;

        const mockRes = {
          writeHead: jest.fn(),
          end: jest.fn(),
        } as unknown as http.ServerResponse;

        await expect(async () => {
          await middleware(mockReq, mockRes, mockNext);
        }).resolves.not.toThrow();
      }

      expect(mockNext).toHaveBeenCalledTimes(3);
    });

    it('should handle ws:false with missing server', async () => {
      const middleware = createProxyMiddleware({
        target: `http://localhost:${WS_SERVER_PORT}`,
        ws: false, // ws disabled
        pathFilter: '/api',
      });

      const mockReq = {
        url: '/other',
        headers: {},
        socket: {}, // no server, but ws is disabled anyway
      } as http.IncomingMessage;

      const mockRes = {
        writeHead: jest.fn(),
        end: jest.fn(),
      } as unknown as http.ServerResponse;

      const mockNext = jest.fn();

      await expect(async () => {
        await middleware(mockReq, mockRes, mockNext);
      }).resolves.not.toThrow();

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
