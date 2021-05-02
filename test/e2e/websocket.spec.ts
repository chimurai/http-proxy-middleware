import * as http from 'http';
import * as WebSocket from 'ws';
import { Server as WebSocketServer } from 'ws';
import { createProxyMiddleware, createApp } from './test-kit';
import type { RequestHandler } from '../../src/types';

/********************************************************************
 * - Not possible to use `supertest` to test WebSockets
 * - Make sure to use different port for each test to avoid flakiness
 ********************************************************************/

describe('E2E WebSocket proxy', () => {
  let proxyServer: http.Server;
  let ws: WebSocket;
  let wss: WebSocketServer;
  let proxyMiddleware: RequestHandler;
  const WS_SERVER_PORT = 9000;

  beforeEach(() => {
    wss = new WebSocketServer({ port: WS_SERVER_PORT });

    wss.on('connection', (websocket) => {
      websocket.on('message', (message) => {
        websocket.send(message); // echo received message
      });
    });
  });

  beforeEach(() => {
    proxyMiddleware = createProxyMiddleware('/', {
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
    beforeEach(async (done) => {
      const SERVER_PORT = 31000;
      proxyServer = createApp(proxyMiddleware).listen(SERVER_PORT);

      // quick & dirty Promise version of http.get (don't care about correctness)
      const get = async (uri) => new Promise((resolve, reject) => http.get(uri, resolve));

      // need to make a normal http request, so http-proxy-middleware can catch the upgrade request
      await get(`http://localhost:${SERVER_PORT}/`);
      // do a second http request to make sure only 1 listener subscribes to upgrade request
      await get(`http://localhost:${SERVER_PORT}/`);

      ws = new WebSocket(`ws://localhost:${SERVER_PORT}/socket`);
      ws.on('open', done);
    });

    it('should proxy to path', (done) => {
      ws.on('message', (message) => {
        expect(message).toBe('foobar');
        done();
      });
      ws.send('foobar');
    });
  });

  describe('option.ws with external server "upgrade"', () => {
    beforeEach((done) => {
      const SERVER_PORT = 32000;
      proxyServer = createApp(proxyMiddleware).listen(SERVER_PORT);
      proxyServer.on('upgrade', proxyMiddleware.upgrade);

      ws = new WebSocket(`ws://localhost:${SERVER_PORT}/socket`);
      ws.on('open', done);
    });

    it('should proxy to path', async (done) => {
      ws.on('message', (message) => {
        expect(message).toBe('foobar');
        done();
      });
      ws.send('foobar');
    });
  });

  describe('option.ws with external server "upgrade" and shorthand usage', () => {
    const SERVER_PORT = 33000;

    beforeEach(() => {
      proxyServer = createApp(
        createProxyMiddleware(`ws://localhost:${WS_SERVER_PORT}`, {
          pathRewrite: { '^/socket': '' },
        })
      ).listen(SERVER_PORT);

      proxyServer.on('upgrade', proxyMiddleware.upgrade);
    });

    beforeEach((done) => {
      ws = new WebSocket(`ws://localhost:${SERVER_PORT}/socket`);
      ws.on('open', done);
    });

    it('should proxy to path', (done) => {
      ws.on('message', (message) => {
        expect(message).toBe('foobar');
        done();
      });
      ws.send('foobar');
    });
  });

  describe('with router and pathRewrite', () => {
    const SERVER_PORT = 34000;

    beforeEach(() => {
      // override
      proxyServer = createApp(
        createProxyMiddleware('ws://notworkinghost:6789', {
          router: { '/socket': `ws://localhost:${WS_SERVER_PORT}` },
          pathRewrite: { '^/socket': '' },
        })
      ).listen(SERVER_PORT);

      proxyServer.on('upgrade', proxyMiddleware.upgrade);
    });

    beforeEach((done) => {
      ws = new WebSocket(`ws://localhost:${SERVER_PORT}/socket`);
      ws.on('open', done);
    });

    it('should proxy to path', (done) => {
      ws.on('message', (message) => {
        expect(message).toBe('foobar');
        done();
      });
      ws.send('foobar');
    });
  });
});
