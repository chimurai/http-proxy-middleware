var expect          = require('chai').expect;
var proxyMiddleware = require('../index');
var http            = require('http');
var express         = require('express');
var WebSocket       = require('ws');
var WebSocketServer = require('ws').Server;

describe('websocket proxy', function () {
    var proxyServer, ws, wss;
    var targetHeaders;
    var responseMessage;

    beforeEach(function () {
        proxyServer = createServer(3000, proxyMiddleware('/', {
                                                target:'http://localhost:8000',
                                                ws: true,
                                                pathRewrite: {
                                                    '^/socket' : ''
                                                }
                                        }));

        wss = new WebSocketServer({ port: 8000 });
        wss.on('connection', function connection(ws) {
            ws.on('message', function incoming(message) {
                ws.send(message);   // echo received message
            });
        });
    });

    beforeEach(function (done) {
        // need to make a normal http request,
        // so http-proxy-middleware can catch the upgrade request
        http.get('http://localhost:3000/', function () {
            // do a second http request to make
            // sure only 1 listener subscribes to upgrade request
            http.get('http://localhost:3000/', function () {
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

    afterEach(function () {
        proxyServer.close();
        wss.close();
        ws = null;
    });

    it('should proxy to path', function () {
        expect(responseMessage).to.equal('foobar');
    });
});

function createServer (portNumber, middleware) {
    var app = express();

    if (middleware) {
        app.use(middleware);
    }

    var server = app.listen(portNumber);

    return server;
}
