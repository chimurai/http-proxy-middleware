var expect          = require('chai').expect;
var proxyTable      = require('./_libs').proxyTable;

describe('proxyTable unit test', function() {

    describe('proxyTable.createProxyOptions', function() {
        var req, config, result;

        beforeEach(function() {
            req = {
                headers: {
                    host: 'localhost'
                },
                url: '/'
            };

            config = {
                target: 'http://localhost:6000',
                changeOrigin: true                 // other options should be returned, such as changeOrigin
            };

            configProxyTable = {
                target: 'http://localhost:6000',
                changeOrigin: true,                // other options should be returned, such as changeOrigin
                proxyTable: {
                    'alpha.localhost': 'http://localhost:6001',
                    'beta.localhost': 'http://localhost:6002',
                    'gamma.localhost/api': 'http://localhost:6003',
                    'gamma.localhost': 'http://localhost:6004',
                    '/rest': 'http://localhost:6005',
                    '/some/specific/path': 'http://localhost:6006',
                    '/some': 'http://localhost:6007'
                }
            };
        });

        describe('without proxyTable config', function() {
            it('should return the normal target when proxyTable not present in config', function() {
                result = proxyTable.createProxyOptions(req, config);
                expect(result.target).to.equal('http://localhost:6000');
                expect(result).not.to.equal(config);            // should return cloned object
                expect(result).to.deep.equal(config);           // clone content should match
                expect(result.changeOrigin).to.be.true;
            });
        });

        describe('with just the host in proxyTable config', function() {
            it('should target http://localhost:6001 when for proxyTable:"alpha.localhost"', function() {
                req.headers.host = 'alpha.localhost';
                result = proxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6001');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6002 when for proxyTable:"beta.localhost"', function() {
                req.headers.host = 'beta.localhost';
                result = proxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6002');
                expect(result.changeOrigin).to.be.true;
            });
        });

        describe('with host and host + path config', function() {
            it('should target http://localhost:6004 without path', function() {
                req.headers.host = 'gamma.localhost';
                result = proxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6004');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6003 exact path match', function() {
                req.headers.host = 'gamma.localhost';
                req.url = '/api';
                result = proxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6003');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6004 when contains path', function() {
                req.headers.host = 'gamma.localhost';
                req.url = '/api/books/123';
                result = proxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6003');
                expect(result.changeOrigin).to.be.true;
            });
        });

        describe('with just the path', function() {
            it('should target http://localhost:6005 with just a path as proxyTable config', function() {
                req.url = '/rest';
                result = proxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6005');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6005 with just a path as proxyTable config', function() {
                req.url = '/rest/deep/path';
                result = proxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6005');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6000 path in not present in proxyTable config', function() {
                req.url = '/unknow-path';
                result = proxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6000');
                expect(result.changeOrigin).to.be.true;
            });
        });

        describe('matching order of proxyTable config', function() {
            it('should return first matching target when similar paths are configured', function() {
                req.url = '/some/specific/path';
                result = proxyTable.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6006');
                expect(result.changeOrigin).to.be.true;
            });
        });

    });

});
