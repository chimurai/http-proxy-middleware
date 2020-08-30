import * as http from 'http';
import * as express from 'express';
import * as WebSocket from 'ws';
// tslint:disable-next-line: no-duplicate-imports
import { Server as WebSocketServer } from 'ws';
import { createProxyMiddleware } from './_utils';

describe('E2E WebSocket proxy', () => {
  let proxyServer: http.Server;
  let ws;
  let wss;
  let responseMessage;
  let proxy;

  beforeEach(() => {
    proxy = createProxyMiddleware('/', {
      target: 'http://localhost:9000',
      ws: true,
      pathRewrite: { '^/socket': '' },
    });

    proxyServer = express().use(proxy).listen(3000);

    wss = new WebSocketServer({ port: 9000 });

    wss.on('connection', function connection(websocket) {
      websocket.on('message', function incoming(message) {
        websocket.send(message); // echo received message
      });
    });
  });

  afterEach((done) => {
    proxyServer.close(() => {
      done();
    });
    wss.close();
    ws = null;
  });

  describe('option.ws', () => {
    beforeEach((done) => {
      // need to make a normal http request,
      // so http-proxy-middleware can catch the upgrade request
      http.get('http://localhost:3000/', () => {
        // do a second http request to make
        // sure only 1 listener subscribes to upgrade request
        http.get('http://localhost:3000/', () => {
          ws = new WebSocket('ws://localhost:3000/socket');

          ws.on('message', function incoming(message) {
            responseMessage = message;
            done();
          });

          ws.on('open', function open() {
            ws.send('foobar');
          });
        });
      });
    });

    it('should proxy to path', () => {
      expect(responseMessage).toBe('foobar');
    });
  });

  describe('option.ws with external server "upgrade"', () => {
    beforeEach((done) => {
      proxyServer.on('upgrade', proxy.upgrade);

      ws = new WebSocket('ws://localhost:3000/socket');

      ws.on('message', function incoming(message) {
        responseMessage = message;
        done();
      });

      ws.on('open', function open() {
        ws.send('foobar');
      });
    });

    it('should proxy to path', () => {
      expect(responseMessage).toBe('foobar');
    });
  });

  describe('option.ws with external server "upgrade" and shorthand usage', () => {
    beforeEach(() => {
      proxyServer.close();

      // override
      proxy = createProxyMiddleware('ws://localhost:9000', {
        pathRewrite: { '^/socket': '' },
      });

      proxyServer = express().use(proxy).listen(3000);
    });

    beforeEach((done) => {
      proxyServer.on('upgrade', proxy.upgrade);

      ws = new WebSocket('ws://localhost:3000/socket');

      ws.on('message', function incoming(message) {
        responseMessage = message;
        done();
      });

      ws.on('open', function open() {
        ws.send('foobar');
      });
    });

    it('should proxy to path', () => {
      expect(responseMessage).toBe('foobar');
    });
  });

  describe('with router and pathRewrite', () => {
    beforeEach(() => {
      proxyServer.close();

      // override
      proxy = createProxyMiddleware('ws://notworkinghost:6789', {
        router: { '/socket': 'ws://localhost:9000' },
        pathRewrite: { '^/socket': '' },
      });

      proxyServer = express().use(proxy).listen(3000);
    });

    beforeEach((done) => {
      proxyServer.on('upgrade', proxy.upgrade);

      ws = new WebSocket('ws://localhost:3000/socket');

      ws.on('message', function incoming(message) {
        responseMessage = message;
        done();
      });

      ws.on('open', function open() {
        ws.send('foobar');
      });
    });

    it('should proxy to path', () => {
      expect(responseMessage).toBe('foobar');
    });
  });
});
