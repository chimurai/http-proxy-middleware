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
      const get = async (uri: string) => new Promise((resolve, reject) => http.get(uri, resolve));

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
});
