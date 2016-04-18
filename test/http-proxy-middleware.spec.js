var expect          = require('chai').expect;
var proxyMiddleware = require('../index');
var http            = require('http');
var express         = require('express');

describe('http-proxy-middleware creation', function() {
    it('should create a middleware', function() {
        var middleware;
        middleware = proxyMiddleware('/api', {target: 'http://localhost:8000'});
        expect(middleware).to.be.a('function');
    });
});

describe('context matching', function() {
    describe('do not proxy', function() {
        var isSkipped;

        beforeEach(function() {
            isSkipped = false;

            var middleware;

            var mockReq = {url: '/foo/bar', originalUrl: '/foo/bar'};
            var mockRes = {};
            var mockNext = function() {
                // mockNext will be called when request is not proxied
                isSkipped = true;
            };

            middleware = proxyMiddleware('/api', {target: 'http://localhost:8000'});
            middleware(mockReq, mockRes, mockNext);
        });

        it('should not proxy requests when request url does not match context' , function() {
            expect(isSkipped).to.be.true;
        });

    });
});

describe('http-proxy-middleware in actual server', function() {

    describe('basic setup, requests to target', function() {
        var proxyServer, targetServer;
        var targetHeaders;
        var targetUrl;
        var responseBody;

        beforeEach(function(done) {
            var mw_proxy = proxyMiddleware('/api', {target: 'http://localhost:8000'});

            var mw_target = function(req, res, next) {
                targetUrl     = req.url;                                  // store target url.
                targetHeaders = req.headers;                              // store target headers.
                res.write('HELLO WEB');                                   // respond with 'HELLO WEB'
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/b/c/d;p?q=1&r=[2,3]#s"', function(res) {
                res.on('data', function(chunk) {
                    responseBody = chunk.toString();
                    done();
                });
            });
        });

        afterEach(function() {
            proxyServer.close();
            targetServer.close();
        });

        it('should have the same headers.host value', function() {
            expect(targetHeaders.host).to.equal('localhost:3000');
        });

        it('should have proxied the uri-path and uri-query, but not the uri-hash', function() {
            expect(targetUrl).to.equal('/api/b/c/d;p?q=1&r=[2,3]');
        });

        it('should have response body: "HELLO WEB"', function() {
            expect(responseBody).to.equal('HELLO WEB');
        });
    });

    describe('custom context matcher/filter', function() {
        var proxyServer, targetServer;
        var targetHeaders;
        var targetUrl;
        var responseBody;

        var filterPath, filterReq;

        beforeEach(function(done) {
            var filter = function(path, req) {
                filterPath = path;
                filterReq = req;
                return true;
            };

            var mw_proxy = proxyMiddleware(filter, {target: 'http://localhost:8000'});

            var mw_target = function(req, res, next) {
                targetUrl     = req.url;                                  // store target url.
                targetHeaders = req.headers;                              // store target headers.
                res.write('HELLO WEB');                                   // respond with 'HELLO WEB'
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/b/c/d', function(res) {
                res.on('data', function(chunk) {
                    responseBody = chunk.toString();
                    done();
                });
            });
        });

        afterEach(function() {
            proxyServer.close();
            targetServer.close();
        });

        it('should have response body: "HELLO WEB"', function() {
            expect(responseBody).to.equal('HELLO WEB');
        });

        it('should provide the url path in the first argument', function() {
            expect(filterPath).to.equal('/api/b/c/d');
        });

        it('should provide the req object in the second argument', function() {
            expect(filterReq.method).to.equal('GET');
        });
    });


    describe('multi path', function() {
        var proxyServer, targetServer;
        var targetHeaders;
        var response, responseBody;

        beforeEach(function() {
            var mw_proxy = proxyMiddleware(['/api', '/ajax'], {target: 'http://localhost:8000'});

            var mw_target = function(req, res, next) {
                res.write(req.url);                                       // respond with req.url
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);
        });

        afterEach(function() {
            proxyServer.close();
            targetServer.close();
        });

        describe('request to path A, configured', function() {
            beforeEach(function(done) {
                http.get('http://localhost:3000/api/some/endpoint', function(res) {
                    response = res;
                    res.on('data', function(chunk) {
                        responseBody = chunk.toString();
                        done();
                    });
                });
            });

            it('should proxy to path A', function() {
                expect(response.statusCode).to.equal(200);
                expect(responseBody).to.equal('/api/some/endpoint');
            });
        });

        describe('request to path B, configured', function() {
            beforeEach(function(done) {
                http.get('http://localhost:3000/ajax/some/library', function(res) {
                    response = res;
                    res.on('data', function(chunk) {
                        responseBody = chunk.toString();
                        done();
                    });
                });
            });

            it('should proxy to path B', function() {
                expect(response.statusCode).to.equal(200);
                expect(responseBody).to.equal('/ajax/some/library');
            });
        });

        describe('request to path C, not configured', function() {
            beforeEach(function(done) {
                http.get('http://localhost:3000/lorum/ipsum', function(res) {
                    response = res;
                    res.on('data', function(chunk) {
                        responseBody = chunk.toString();
                        done();
                    });
                });
            });

            it('should not proxy to this path', function() {
                expect(response.statusCode).to.equal(404);
            });
        });

    });

    describe('wildcard path matching', function() {
        var proxyServer, targetServer;
        var targetHeaders;
        var response, responseBody;

        beforeEach(function() {
            var mw_proxy = proxyMiddleware('/api/**', {target: 'http://localhost:8000'});

            var mw_target = function(req, res, next) {
                res.write(req.url);                                       // respond with req.url
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);
        });

        beforeEach(function(done) {
            http.get('http://localhost:3000/api/some/endpoint', function(res) {
                response = res;
                res.on('data', function(chunk) {
                    responseBody = chunk.toString();
                    done();
                });
            });
        });

        afterEach(function() {
            proxyServer.close();
            targetServer.close();
        });

        it('should proxy to path', function() {
            expect(response.statusCode).to.equal(200);
            expect(responseBody).to.equal('/api/some/endpoint');
        });
    });

    describe('multi glob wildcard path matching', function() {
        var proxyServer, targetServer;
        var targetHeaders;
        var responseA, responseBodyA;
        var responseB, responseBodyB;

        beforeEach(function() {
            var mw_proxy = proxyMiddleware(['/**.html', '!**.json'], {target: 'http://localhost:8000'});

            var mw_target = function(req, res, next) {
                res.write(req.url);                                       // respond with req.url
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);
        });

        beforeEach(function(done) {
            http.get('http://localhost:3000/api/some/endpoint/index.html', function(res) {
                responseA = res;
                res.on('data', function(chunk) {
                    responseBodyA = chunk.toString();
                    done();
                });
            });
        });

        beforeEach(function(done) {
            http.get('http://localhost:3000/api/some/endpoint/data.json', function(res) {
                responseB = res;
                res.on('data', function(chunk) {
                    responseBodyB = chunk.toString();
                    done();
                });
            });
        });

        afterEach(function() {
            proxyServer.close();
            targetServer.close();
        });

        it('should proxy to paths ending with *.html', function() {
            expect(responseA.statusCode).to.equal(200);
            expect(responseBodyA).to.equal('/api/some/endpoint/index.html');
        });

        it('should not proxy to paths ending with *.json', function() {
            expect(responseB.statusCode).to.equal(404);
        });
    });

    describe('option.headers - additional request headers', function() {
        var proxyServer, targetServer;
        var targetHeaders;

        beforeEach(function(done) {
            var mw_proxy = proxyMiddleware('/api', {target: 'http://localhost:8000', headers: {host: 'foobar.dev'}});

            var mw_target = function(req, res, next) {
                targetHeaders = req.headers;
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/', function(res) {
                done();
            });
        });

        afterEach(function() {
            proxyServer.close();
            targetServer.close();
        });

        it('should send request header "host" to target server', function() {
            expect(targetHeaders.host).to.equal('foobar.dev');
        });
    });

    describe('legacy option.proxyHost', function() {
        var proxyServer, targetServer;
        var targetHeaders;

        beforeEach(function(done) {
            var mw_proxy = proxyMiddleware('/api', {target: 'http://localhost:8000', proxyHost: 'foobar.dev'});

            var mw_target = function(req, res, next) {
                targetHeaders = req.headers;
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/', function(res) {
                done();
            });
        });

        afterEach(function() {
            proxyServer.close();
            targetServer.close();
        });

        it('should proxy host header to target server', function() {
            expect(targetHeaders.host).to.equal('foobar.dev');
        });
    });

    describe('option.onError - Error handling', function() {
        var proxyServer, targetServer;
        var response, responseBody;

        describe('default', function() {
            beforeEach(function(done) {
                var mw_proxy = proxyMiddleware('/api', {target: 'http://localhost:666'});  // unreachable host on port:666
                var mw_target = function(req, res, next) {next();};

                proxyServer = createServer(3000, mw_proxy);
                targetServer = createServer(8000, mw_target);

                http.get('http://localhost:3000/api/', function(res) {
                    response = res;
                    done();
                });
            });

            afterEach(function() {
                proxyServer.close();
                targetServer.close();
            });

            it('should handle errors when host is not reachable', function() {
                expect(response.statusCode).to.equal(500);
            });
        });

        describe('custom', function() {
            beforeEach(function(done) {
                var customOnError = function(err, req, res) {
                    res.writeHead(418);     // different error code
                    res.end('I\'m a teapot');              // no response body
                };

                var mw_proxy = proxyMiddleware('/api', {target: 'http://localhost:666', onError: customOnError});  // unreachable host on port:666
                var mw_target = function(req, res, next) {next();};

                proxyServer = createServer(3000, mw_proxy);
                targetServer = createServer(8000, mw_target);

                http.get('http://localhost:3000/api/', function(res) {
                    response = res;
                    res.on('data', function(chunk) {
                        responseBody = chunk.toString();
                        done();
                    });
                });
            });

            afterEach(function() {
                proxyServer.close();
                targetServer.close();
            });

            it('should respond with custom http status code', function() {
                expect(response.statusCode).to.equal(418);
            });

            it('should respond with custom status message', function() {
                expect(responseBody).to.equal('I\'m a teapot');
            });
        });
    });

    describe('option.onProxyRes', function() {
        var proxyServer, targetServer;
        var response, responseBody;

        beforeEach(function(done) {
            var fnOnProxyRes = function(proxyRes, req, res) {
                proxyRes.headers['x-added'] = 'foobar';                        // add custom header to response
                delete proxyRes.headers['x-removed'];
            };

            var mw_proxy = proxyMiddleware('/api', {
                target: 'http://localhost:8000',
                onProxyRes: fnOnProxyRes
            });
            var mw_target = function(req, res, next) {
                res.setHeader('x-removed', 'remove-header');
                res.write(req.url);                                       // respond with req.url
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/foo/bar', function(res) {
                response = res;
                res.on('data', function(chunk) {
                    responseBody = chunk.toString();
                    done();
                });
            });
        });

        afterEach(function() {
            proxyServer.close();
            targetServer.close();
        });

        it('should add `x-added` as custom header to response"', function() {
            expect(response.headers['x-added']).to.equal('foobar');
        });

        it('should remove `x-removed` field from response header"', function() {
            expect(response.headers['x-removed']).to.equal(undefined);
        });
    });

    describe('option.onProxyReq', function() {
        var proxyServer, targetServer;
        var receivedRequest;

        beforeEach(function(done) {
            var fnOnProxyReq = function(proxyReq, req, res) {
                proxyReq.setHeader('x-added', 'foobar');                // add custom header to request
            };

            var mw_proxy = proxyMiddleware('/api', {
                target: 'http://localhost:8000',
                onProxyReq: fnOnProxyReq
            });

            var mw_target = function(req, res, next) {
                receivedRequest = req;
                res.write(req.url);                                       // respond with req.url
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/foo/bar', function() {
                done();
            });
        });

        afterEach(function() {
            proxyServer.close();
            targetServer.close();
        });

        it('should add `x-added` as custom header to request"', function() {
            expect(receivedRequest.headers['x-added']).to.equal('foobar');
        });
    });

    describe('option.pathRewrite', function() {
        var proxyServer, targetServer;
        var responseBody;

        beforeEach(function(done) {
            var mw_proxy = proxyMiddleware('/api', {
                target: 'http://localhost:8000',
                pathRewrite: {
                    '^/api': '/rest',
                    '^/remove': ''
                }
            });
            var mw_target = function(req, res, next) {
                res.write(req.url);                                       // respond with req.url
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/foo/bar', function(res) {
                res.on('data', function(chunk) {
                    responseBody = chunk.toString();
                    done();
                });
            });
        });

        afterEach(function() {
            proxyServer.close();
            targetServer.close();
        });

        it('should have rewritten path from "/api/foo/bar" to "/rest/foo/bar"', function() {
            expect(responseBody).to.equal('/rest/foo/bar');
        });
    });

    describe('shorthand usage', function() {
        var proxyServer, targetServer;
        var responseBody;

        beforeEach(function(done) {
            var mw_proxy = proxyMiddleware('http://localhost:8000/api');
            var mw_target = function(req, res, next) {
                res.write(req.url);                                       // respond with req.url
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/foo/bar', function(res) {
                res.on('data', function(chunk) {
                    responseBody = chunk.toString();
                    done();
                });
            });
        });

        afterEach(function() {
            proxyServer.close();
            targetServer.close();
        });

        it('should have proxy with shorthand configuration', function() {
            expect(responseBody).to.equal('/api/foo/bar');
        });
    });

    describe('express with path + proxy', function() {
        var proxyServer, targetServer;
        var responseBody;

        beforeEach(function(done) {
            var mw_proxy = proxyMiddleware('http://localhost:8000');
            var mw_target = function(req, res, next) {
                res.write(req.url);                                       // respond with req.url
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy, '/api');
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/foo/bar', function(res) {
                res.on('data', function(chunk) {
                    responseBody = chunk.toString();
                    done();
                });
            });
        });

        afterEach(function() {
            proxyServer.close();
            targetServer.close();
        });

        it('should proxy to target with the baseUrl', function() {
            expect(responseBody).to.equal('/api/foo/bar');
        });

    });

    describe('option.logLevel & option.logProvider', function() {
        var proxyServer, targetServer;
        var responseBody;
        var logMessage;

        beforeEach(function(done) {
            var customLogger = function(message) {
                logMessage = message;
            };

            var mw_proxy = proxyMiddleware('http://localhost:8000/api', {
                logLevel: 'info',
                logProvider: function(provider) {
                    provider.debug = customLogger;
                    provider.info = customLogger;
                    return provider;
                }
            });
            var mw_target = function(req, res, next) {
                res.write(req.url);                                       // respond with req.url
                res.end();
            };

            proxyServer = createServer(3000, mw_proxy);
            targetServer = createServer(8000, mw_target);

            http.get('http://localhost:3000/api/foo/bar', function(res) {
                res.on('data', function(chunk) {
                    responseBody = chunk.toString();
                    done();
                });
            });
        });

        afterEach(function() {
            proxyServer.close();
            targetServer.close();
        });

        it('should have logged messages', function() {
            expect(logMessage).not.to.equal(undefined);
        });
    });

});

function createServer(portNumber, middleware, path) {
    var app = express();

    if (middleware, path) {
        app.use(path, middleware);
    } else if (middleware) {
        app.use(middleware);
    }

    var server = app.listen(portNumber);

    return server;
}
