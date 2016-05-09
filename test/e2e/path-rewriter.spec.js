var utils           = require('./_utils');
var expect          = require('chai').expect;
var http            = require('http');

describe('E2E pathRewrite', function() {
    var createServer;
    var proxyMiddleware;

    beforeEach(function() {
        createServer = utils.createServer;
        proxyMiddleware = utils.proxyMiddleware;
    });

    var targetMiddleware;
    var targetData;

    beforeEach(function() {
        targetData = {};
        targetMiddleware = function(req, res, next) {
            targetData.url     = req.url;               // store target url.
            targetData.headers = req.headers;           // store target headers.
            res.write(req.url);                         // respond with target url.
            res.end();
        };
    });

    var proxyServer;
    var targetServer;

    beforeEach(function() {
        targetServer = createServer(8000, targetMiddleware);
    });

    afterEach(function() {
        proxyServer && proxyServer.close();
        targetServer.close();
    });

    describe('Rewrite paths with rules table', function() {
        beforeEach(function() {
            var proxyConfig = {
                target: 'http://localhost:8000',
                pathRewrite: {
                    '^/foobar/api/': '/api/'
                }
            };
            var proxy = proxyMiddleware(proxyConfig);
            proxyServer = createServer(3000, proxy);
        });

        beforeEach(function(done) {
            http.get('http://localhost:3000/foobar/api/lorum/ipsum', function(res) {
                done();
            });
        });

        it('should remove "/foobar" from path', function() {
            expect(targetData.url).to.equal('/api/lorum/ipsum');
        });
    });

    describe('Rewrite paths with function', function() {
        var originalPath;
        var pathRewriteReqObject;

        beforeEach(function() {
            var proxyConfig = {
                target: 'http://localhost:8000',
                pathRewrite: function(path, req) {
                    originalPath = path;
                    pathRewriteReqObject = req;
                    return path.replace('/foobar', '');
                }
            };
            var proxy = proxyMiddleware(proxyConfig);
            proxyServer = createServer(3000, proxy);
        });

        beforeEach(function(done) {
            http.get('http://localhost:3000/foobar/api/lorum/ipsum', function(res) {
                done();
            });
        });

        it('should remove "/foobar" from path', function() {
            expect(targetData.url).to.equal('/api/lorum/ipsum');
        });

        it('should provide the `path` parameter with the unmodified path value', function() {
            expect(originalPath).to.equal('/foobar/api/lorum/ipsum');
        });

        it('should provide the `req` object as second parameter of the rewrite function', function() {
            expect(pathRewriteReqObject.method).to.equal('GET');
            expect(pathRewriteReqObject.url).to.equal('/api/lorum/ipsum');
        });
    });
});
