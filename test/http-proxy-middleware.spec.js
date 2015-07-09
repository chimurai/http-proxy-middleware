var expect          = require('chai').expect;
var proxyMiddleware = require('../index');
var http            = require('http');
var express         = require('express');

describe('http-proxy-middleware creation', function () {
    it('should create a middleware', function () {
        var middleware;
        middleware = proxyMiddleware('/api', {target:'http://localhost:8000'});
        expect(middleware).to.be.a('function');
    });
});

describe('context matching', function () {
    describe('do not proxy', function () {
        var isSkipped;

        beforeEach(function () {
            isSkipped = false;

            var middleware;

            var mockReq = {url:'/foo/bar'};
            var mockRes = {};
            var mockNext = function () {
                // mockNext will be called when request is not proxied
                isSkipped = true;
            };

            middleware = proxyMiddleware('/api', {target:'http://localhost:8000'});
            middleware(mockReq, mockRes, mockNext);
        });

        it('should not proxy requests when request url does not match context' , function () {
            expect(isSkipped).to.be.true;
        });

    });
});

describe('http-proxy-middleware in actual server', function () {

    describe('basic setup', function () {
        var proxyServer, targetServer;
        var targetHeaders;
        var responseBody;

        beforeEach(function (done) {
            var mw_proxy = proxyMiddleware('/api', {target:'http://localhost:8000'});

            var mw_target = function (req, res, next) {
                targetHeaders = req.headers;                              // store target headers.
                res.write('HELLO WEB');                                   // respond with 'HELLO WEB'
                res.end()
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/', function (res) {
                res.on('data', function (chunk) {
                    responseBody = chunk.toString();
                    done();
                });
            });
        });

        afterEach(function () {
            proxyServer.close();
            targetServer.close();
        });

        it('should have the same headers.host value', function () {
            expect(targetHeaders.host).to.equal('localhost:3000');
        });

        it('should have response body: "HELLO WEB"', function () {
            expect(responseBody).to.equal('HELLO WEB');
        });
    });

    describe('additional request headers', function () {
        var proxyServer, targetServer;
        var targetHeaders;

        beforeEach(function (done) {
            var mw_proxy = proxyMiddleware('/api', { target:'http://localhost:8000', headers: {host:'foobar.dev'} });

            var mw_target = function (req, res, next) {
                targetHeaders = req.headers;
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/', function (res) {
                done();
            });
        });

        afterEach(function () {
            proxyServer.close();
            targetServer.close();
        });

        it('should send request header "host" to target server', function () {
            expect(targetHeaders.host).to.equal('foobar.dev');
        });
    });

    describe('legacy proxyHost parameter', function () {
        var proxyServer, targetServer;
        var targetHeaders;

        beforeEach(function (done) {
            var mw_proxy = proxyMiddleware('/api', {target:'http://localhost:8000', proxyHost: 'foobar.dev'});

            var mw_target = function (req, res, next) {
                targetHeaders = req.headers;
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/', function (res) {
                done();
            });
        });

        afterEach(function () {
            proxyServer.close();
            targetServer.close();
        });


        it('should proxy host header to target server', function () {
            expect(targetHeaders.host).to.equal('foobar.dev');
        });
    });

    describe('Error handling', function () {
        var proxyServer, targetServer;
        var response;

        beforeEach(function (done) {
            var mw_proxy = proxyMiddleware('/api', {target:'http://localhost:666'});  // unreachable host on port:666
            var mw_target = function (req, res, next) {next()};

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/', function (res) {
                response = res;
                done();
            });
        });

        afterEach(function () {
            proxyServer.close();
            targetServer.close();
        });


        it('should handle errors when host is not reachable', function () {
            expect(response.statusCode).to.equal(500);
        });
    });

    describe('Rewrite path', function () {
        var proxyServer, targetServer;
        var responseBody;

        beforeEach(function (done) {
            var mw_proxy = proxyMiddleware('/api', {
                target:'http://localhost:8000',
                pathRewrite: {
                    '^/api' : '/rest',
                    '^/remove' : ''
                }
            });
            var mw_target = function (req, res, next) {
                res.write(req.url);                                       // respond with req.url
                res.end()
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/foo/bar', function (res) {
                res.on('data', function (chunk) {
                    responseBody = chunk.toString();
                    done();
                });
            });
        });

        afterEach(function () {
            proxyServer.close();
            targetServer.close();
        });

        it('should have rewritten path from "/api/foo/bar" to "/rest/foo/bar"', function () {
            expect(responseBody).to.equal('/rest/foo/bar');
        });
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
