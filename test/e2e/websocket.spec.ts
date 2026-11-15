import * as http from 'node:http';
import { Socket } from 'node:net';

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

  describe('unmatched WebSocket upgrade', () => {
    it('should handle socket errors without destroying the socket', () => {
      const logger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      const middleware = createProxyMiddleware({
        target: 'http://localhost:1234',
        pathFilter: '/ws',
        ws: true,
        logger,
      });
      proxyServer = http.createServer();
      ws = { close: () => undefined } as WebSocket;

      // The upgrade hook discovers the server from the incoming request's socket.
      const req = {
        url: '/',
        socket: { server: proxyServer },
      } as unknown as http.IncomingMessage;
      const socket = new Socket();
      const socketError = new Error('connection reset');

      // This unmatched upgrade must remain safe for another middleware to handle.
      middleware.upgrade(req, socket, Buffer.alloc(0));

      // Simulate the socket error caused by a client TCP reset.
      expect(() => socket.emit('error', socketError)).not.toThrow();
      expect(logger.error).toHaveBeenCalledWith(socketError);
      expect(socket.destroyed).toBe(false);
      // This unconnected test socket is destroyed only for cleanup.
      socket.destroy();
    });
  });

  describe('matched WebSocket upgrade', () => {
    it('should retain the socket error guard until proxy.ws installs its listener', async () => {
      const logger = {
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
      };
      let resolveRouter: (target: string) => void = () => {};
      // Keep preparation pending so the temporary socket guard handles early errors.
      const routerReady = new Promise<string>((resolve) => {
        resolveRouter = resolve;
      });
      const middleware = createProxyMiddleware({
        target: `http://localhost:${WS_SERVER_PORT}`,
        pathFilter: '/ws',
        ws: true,
        logger,
        router: () => routerReady,
      });
      proxyServer = http.createServer();
      ws = { close: () => undefined } as WebSocket;

      const req = {
        url: '/ws',
        method: 'GET',
        headers: { upgrade: 'websocket' },
        socket: { server: proxyServer },
      } as unknown as http.IncomingMessage;
      const socket = new Socket();
      const socketError = new Error('connection reset');

      // A matched upgrade must install the guard before asynchronous preparation starts.
      middleware.upgrade(req, socket, Buffer.alloc(0));
      await Promise.resolve();

      const temporaryErrorListener = socket.listeners('error')[0];
      expect(temporaryErrorListener).toBeDefined();
      expect(socket.listenerCount('error')).toBe(1);

      expect(() => socket.emit('error', socketError)).not.toThrow();
      expect(logger.error).toHaveBeenCalledWith(socketError);
      expect(socket.listeners('error')).toContain(temporaryErrorListener);

      // proxy.ws installs its own listener synchronously; only then may the temporary guard go.
      resolveRouter(`http://localhost:${WS_SERVER_PORT}`);
      await routerReady;
      await new Promise<void>((resolve) => setImmediate(resolve));

      expect(socket.listeners('error')).not.toContain(temporaryErrorListener);
      expect(socket.listenerCount('error')).toBe(1);

      socket.destroy();
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
});
