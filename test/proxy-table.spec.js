var expect          = require('chai').expect;
var proxyMiddleware = require('../index');
var ProxyTable      = require('../lib/proxy-table');
var http            = require('http');
var express         = require('express');
var _               = require('lodash');

describe('Proxy Table', function () {


    describe('in actual server', function () {
        var proxyServer, targetServerA, targetServerB, targetServerC;

        beforeEach(function setupServers () {

            targetServerA = createServer(6001, function (req, res, next) {
                res.write('A');
                res.end();
            });

            targetServerB = createServer(6002, function (req, res, next) {
                res.write('B');
                res.end();
            });

            targetServerC = createServer(6003, function (req, res, next) {
                res.write('C');
                res.end();
            });

            proxyServer = createServer(6000, proxyMiddleware('/', {
                target: 'http://localhost:6001',
                proxyTable : {
                    'alpha.localhost:6000' : 'http://localhost:6001',
                    'beta.localhost:6000' : 'http://localhost:6002',
                    'localhost:6000/api' : 'http://localhost:6003'
                }
            }));

        });

        afterEach(function () {
            proxyServer.close();
            targetServerA.close();
            targetServerB.close();
            targetServerC.close();
        });

        it('should proxy to option.target', function (done) {
            http.get('http://localhost:6000', function (res) {
                res.on('data', function (chunk) {
                    var responseBody = chunk.toString();
                    expect(responseBody).to.equal('A');
                    done();
                });
            });
        });

        it('should proxy to proxyTable: "alpha.localhost"', function (done) {
            var options = {hostname:'localhost', port:6000, path:'/'};
            options.headers = {host: 'alpha.localhost:6000'}
            http.get(options, function (res) {
                res.on('data', function (chunk) {
                    var responseBody = chunk.toString();
                    expect(responseBody).to.equal('A');
                    done();
                });
            });
        });

        it('should proxy to proxyTable: "beta.localhost"', function (done) {
            var options = {hostname:'localhost', port:6000, path:'/'};
            options.headers = {host: 'beta.localhost:6000'}
            http.get(options, function (res) {
                res.on('data', function (chunk) {
                    var responseBody = chunk.toString();
                    expect(responseBody).to.equal('B');
                    done();
                });
            });
        });

        it('should proxy to proxyTable with path config: "localhost:6000/api"', function (done) {
            var options = {hostname:'localhost', port:6000, path:'/api'};
            http.get(options, function (res) {
                res.on('data', function (chunk) {
                    var responseBody = chunk.toString();
                    expect(responseBody).to.equal('C');
                    done();
                });
            });
        });
    });

    describe('ProxyTable.createProxyOptions', function () {
        var req, config, result;

        beforeEach(function () {
            req = {
                headers : {
                    host : 'localhost'
                },
                url : '/'
            };

            config = {
                target : 'http://localhost:6000',
                changeOrigin : true                 // other options should be returned, such as changeOrigin
            }

            configProxyTable = {
                target : 'http://localhost:6000',
                changeOrigin : true,                // other options should be returned, such as changeOrigin
                proxyTable : {
                    'alpha.localhost'     : 'http://localhost:6001',
                    'beta.localhost'      : 'http://localhost:6002',
                    'gamma.localhost/api' : 'http://localhost:6003',
                    'gamma.localhost'     : 'http://localhost:6004',
                    '/rest'               : 'http://localhost:6005',
                    '/some/specific/path' : 'http://localhost:6006',
                    '/some'               : 'http://localhost:6007'
                }
            }
        });

        describe('without proxyTable config', function () {
            it('should return the normal target when proxyTable not present in config', function () {
                result = ProxyTable.createProxyOptions(req, config);
                expect(result.target).to.equal('http://localhost:6000');
                expect(result).not.to.equal(config);            // should return cloned object
                expect(_.isEqual(result, config)).to.be.true;   // clone content should match
                expect(result.changeOrigin).to.be.true;
            });
        });

        describe('with just the host in proxyTable config', function () {
            it('should target http://localhost:6001 when for proxyTable:"alpha.localhost"', function () {
                req.headers.host = 'alpha.localhost';
                result = ProxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6001');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6002 when for proxyTable:"beta.localhost"', function () {
                req.headers.host = 'beta.localhost';
                result = ProxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6002');
                expect(result.changeOrigin).to.be.true;
            });
        });

        describe('with host and host + path config', function () {
            it('should target http://localhost:6004 without path', function () {
                req.headers.host = 'gamma.localhost';
                result = ProxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6004');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6003 exact path match', function () {
                req.headers.host = 'gamma.localhost';
                req.url = '/api'
                result = ProxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6003');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6004 when contains path', function () {
                req.headers.host = 'gamma.localhost';
                req.url = '/api/books/123'
                result = ProxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6003');
                expect(result.changeOrigin).to.be.true;
            });
        });

        describe('with just the path', function () {
            it('should target http://localhost:6005 with just a path as proxyTable config', function () {
                req.url = '/rest';
                result = ProxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6005');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6005 with just a path as proxyTable config', function () {
                req.url = '/rest/deep/path';
                result = ProxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6005');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6000 path in not present in proxyTable config', function () {
                req.url = '/unknow-path';
                result = ProxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6000');
                expect(result.changeOrigin).to.be.true;
            });
        });

        describe('matching order of proxyTable config', function () {
            it('should return first matching target when similar paths are configured', function () {
                req.url = '/some/specific/path';
                result = ProxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6006');
                expect(result.changeOrigin).to.be.true;
            });
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
