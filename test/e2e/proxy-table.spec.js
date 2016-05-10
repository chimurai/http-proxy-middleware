var utils           = require('./_utils');
var expect          = require('chai').expect;
var http            = require('http');

describe('E2E proxyTable', function() {
    var createServer;
    var proxyMiddleware;

    beforeEach(function() {
        createServer = utils.createServer;
        proxyMiddleware = utils.proxyMiddleware;
    });

    describe('in actual server', function() {
        var proxyServer, targetServerA, targetServerB, targetServerC;

        beforeEach(function setupServers() {

            targetServerA = createServer(6001, function(req, res, next) {
                res.write('A');
                res.end();
            });

            targetServerB = createServer(6002, function(req, res, next) {
                res.write('B');
                res.end();
            });

            targetServerC = createServer(6003, function(req, res, next) {
                res.write('C');
                res.end();
            });

            proxyServer = createServer(6000, proxyMiddleware('/', {
                target: 'http://localhost:6001',
                proxyTable: {
                    'alpha.localhost:6000': 'http://localhost:6001',
                    'beta.localhost:6000': 'http://localhost:6002',
                    'localhost:6000/api': 'http://localhost:6003'
                }
            }));

        });

        afterEach(function() {
            proxyServer.close();
            targetServerA.close();
            targetServerB.close();
            targetServerC.close();
        });

        it('should proxy to option.target', function(done) {
            http.get('http://localhost:6000', function(res) {
                res.on('data', function(chunk) {
                    var responseBody = chunk.toString();
                    expect(responseBody).to.equal('A');
                    done();
                });
            });
        });

        it('should proxy to proxyTable: "alpha.localhost"', function(done) {
            var options = {hostname: 'localhost', port: 6000, path: '/'};
            options.headers = {host: 'alpha.localhost:6000'};
            http.get(options, function(res) {
                res.on('data', function(chunk) {
                    var responseBody = chunk.toString();
                    expect(responseBody).to.equal('A');
                    done();
                });
            });
        });

        it('should proxy to proxyTable: "beta.localhost"', function(done) {
            var options = {hostname: 'localhost', port: 6000, path: '/'};
            options.headers = {host: 'beta.localhost:6000'};
            http.get(options, function(res) {
                res.on('data', function(chunk) {
                    var responseBody = chunk.toString();
                    expect(responseBody).to.equal('B');
                    done();
                });
            });
        });

        it('should proxy to proxyTable with path config: "localhost:6000/api"', function(done) {
            var options = {hostname: 'localhost', port: 6000, path: '/api'};
            http.get(options, function(res) {
                res.on('data', function(chunk) {
                    var responseBody = chunk.toString();
                    expect(responseBody).to.equal('C');
                    done();
                });
            });
        });
    });
});
