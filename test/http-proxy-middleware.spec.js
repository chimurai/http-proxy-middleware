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
    var servers;

    describe('basic setup', function () {
        var targetHeaders;
        var responseBody;

        beforeEach(function (done) {
            servers = createServers({
                proxy: proxyMiddleware('/api', {target:'http://localhost:8000'}),
                sourceMiddleware : function (req, res, next) {next()},
                targetMiddleware: function (req, res, next) {
                    targetHeaders = req.headers;                              // store target headers.
                    res.write('HELLO WEB');                                   // respond with 'HELLO WEB'
                    res.end()
                },
            });

            http.get('http://localhost:3000/api/', function (res) {
                res.on('data', function (chunk) {
                    responseBody = chunk.toString();
                    done();
                });
            });
        });


        it('should have the same headers.host value', function () {
            expect(targetHeaders.host).to.equal('localhost:3000');
        });

        it('should have response body: "HELLO WEB"', function () {
            expect(responseBody).to.equal('HELLO WEB');
        });
    });

    describe('additional request headers', function () {
        var targetHeaders;

        beforeEach(function (done) {
            servers = createServers({
                proxy: proxyMiddleware('/api', {target:'http://localhost:8000', headers: {host:'foobar.dev'} }),
                sourceMiddleware : function (req, res, next) {next()},
                targetMiddleware: function (req, res, next) {
                    targetHeaders = req.headers;                              // host
                    res.end();
                },
            });

            http.get('http://localhost:3000/api/', function (res) {
                done();
            });

        });

        it('should send request header "host" to target server', function () {
            expect(targetHeaders.host).to.equal('foobar.dev');
        });
    });

    describe('legacy proxyHost parameter', function () {
        var targetHeaders;

        beforeEach(function (done) {
            servers = createServers({
                proxy: proxyMiddleware('/api', {target:'http://localhost:8000', proxyHost: 'foobar.dev'}),
                sourceMiddleware : function (req, res, next) {next()},
                targetMiddleware: function (req, res, next) {
                    targetHeaders = req.headers;                              // host
                    res.end();
                },
            });

            http.get('http://localhost:3000/api/', function (res) {
                done();
            });

        });

        it('should proxy host header to target server', function () {
            expect(targetHeaders.host).to.equal('foobar.dev');
        });
    });

    describe('Error handling', function () {
        var response;

        beforeEach(function (done) {
            servers = createServers({
                proxy: proxyMiddleware('/api', {target:'http://localhost:666'}),  // unreachable host on port:666
                sourceMiddleware : function (req, res, next) {next()},
                targetMiddleware: function (req, res, next) {next()},
            });

            http.get('http://localhost:3000/api/', function (res) {
                response = res;
                done();
            });
        });

        it('should handle errors when host is not reachable', function () {
            expect(response.statusCode).to.equal(500);
        });
    });

    afterEach(function () {
        closeServers(servers);
        servers = null;
    });

});


/**
 *  source Server: http:localhost:3000
 *  target Server: http:localhost:8000
 **/
function createServers (options) {
    var sourceServer,
        targetServer;

    // source server
    var sourceApp = express();
        sourceApp.use(options.sourceMiddleware);
        sourceApp.use(options.proxy);
        sourceServer = sourceApp.listen(3000);


    // target server
    var targetApp = express();
        targetApp.use(options.targetMiddleware);
        targetServer = targetApp.listen(8000);

    return {
        sourceServer : sourceServer,
        targetServer : targetServer,
    }
}

function closeServers (servers) {
    servers.sourceServer.close();
    servers.targetServer.close();
}
