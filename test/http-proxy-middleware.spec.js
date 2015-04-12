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

describe('http-proxy-middleware pass through', function () {
    it('should not proxy requests when request url does not match context' , function () {
        var middleware;
        var skipped = false;

        var mockReq = {url:'/foo/bar'};
        var mockRes = {};
        var mockNext = function () {
            // mockNext will be called when request is not proxied
            skipped = true;
        };

        middleware = proxyMiddleware('/api', {target:'http://localhost:8000'});
        middleware(mockReq, mockRes, mockNext);
        expect(skipped).to.be.true;
    });
});

describe('http-proxy-middleware as middleware in actual server', function () {

    it('should proxy requests to target server', function (done) {
        var hostResult;

        var servers = createServers({
            proxy: proxyMiddleware('/api', {target:'http://localhost:8000'}),
            sourceMiddleware : function (req, res, next) {next()},
            targetMiddleware: function (req, res, next) {
                hostResult = req.headers.host;                              // host
                res.write('BBB');                                           // respond with 'BBB'
                res.end()
            },
        });

        http.get('http://localhost:3000/api/', function (res) {
            expect(hostResult).to.equal('localhost:8000');                  // should be target host

            res.on('data', function (chunk) {
                expect(chunk.toString()).to.equal('BBB');

                // clean up and finish
                closeServers(servers);
                servers = null;
                done();
            });
        });
    });

    it('should proxy host header to target server', function (done) {
        var hostResult;

        var servers = createServers({
            proxy: proxyMiddleware('/api', {target:'http://localhost:8000', host:'foobar.dev'}),
            sourceMiddleware : function (req, res, next) {next()},
            targetMiddleware: function (req, res, next) {
                hostResult = req.headers.host;                              // host
                res.end();
            },
        });

        http.get('http://localhost:3000/api/', function (res) {

            expect(hostResult).to.equal('foobar.dev');

            // clean up and finish
            closeServers(servers);
            servers = null;
            done();
        });
    });

    it('should handle errors when host is not reachable', function (done) {
        var hostResult;

        var servers = createServers({
            proxy: proxyMiddleware('/api', {target:'http://localhost:666'}),  // unreachable host on port:666
            sourceMiddleware : function (req, res, next) {next()},
            targetMiddleware: function (req, res, next) {next()},
        });

        http.get('http://localhost:3000/api/', function (res) {
            expect(res.statusCode).to.equal(500);

            // clean up and finish
            closeServers(servers);
            servers = null;
            done();
        });
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
