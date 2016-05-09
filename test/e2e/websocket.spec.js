var utils           = require('./_utils');
var expect          = require('chai').expect;
var http            = require('http');
var WebSocket       = require('ws');
var WebSocketServer = require('ws').Server;

describe('E2E WebSocket proxy', function() {
    var createServer;
    var proxyMiddleware;

    beforeEach(function() {
        createServer = utils.createServer;
        proxyMiddleware = utils.proxyMiddleware;
    });

    var proxyServer, ws, wss;
    var targetHeaders;
    var responseMessage;
    var proxy;

    beforeEach(function() {
        proxy = proxyMiddleware('/', {
                                        target: 'http://localhost:8000',
                                        ws: true,
                                        pathRewrite: {'^/socket': ''}
                                    });

        proxyServer = createServer(3000, proxy);

        wss = new WebSocketServer({port: 8000});

        wss.on('connection', function connection(ws) {
            ws.on('message', function incoming(message) {
                ws.send(message);   // echo received message
            });
        });
    });

    describe('option.ws', function() {
        beforeEach(function(done) {
            // need to make a normal http request,
            // so http-proxy-middleware can catch the upgrade request
            http.get('http://localhost:3000/', function() {
                // do a second http request to make
                // sure only 1 listener subscribes to upgrade request
                http.get('http://localhost:3000/', function() {
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

        it('should proxy to path', function() {
            expect(responseMessage).to.equal('foobar');
        });
    });

    describe('option.ws with external server "upgrade"', function() {
        beforeEach(function(done) {
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

        it('should proxy to path', function() {
            expect(responseMessage).to.equal('foobar');
        });
    });

    describe('option.ws with external server "upgrade" and shorthand usage', function() {

        beforeEach(function() {
            proxyServer.close();
            // override
            proxy = proxyMiddleware('ws://localhost:8000', {pathRewrite: {'^/socket': ''}});
            proxyServer = createServer(3000, proxy);
        });

        beforeEach(function(done) {
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

        it('should proxy to path', function() {
            expect(responseMessage).to.equal('foobar');
        });
    });

    describe('with proxyTable and pathRewrite', function() {

        beforeEach(function() {
            proxyServer.close();
            // override
            proxy = proxyMiddleware('ws://notworkinghost:6789', {proxyTable: {'/socket': 'ws://localhost:8000'}, pathRewrite: {'^/socket': ''}});
            proxyServer = createServer(3000, proxy);
        });

        beforeEach(function(done) {
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

        it('should proxy to path', function() {
            expect(responseMessage).to.equal('foobar');
        });
    });

    afterEach(function() {
        proxyServer.close();
        wss.close();
        ws = null;
    });
});
