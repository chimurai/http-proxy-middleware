var expect = require('chai').expect;
var router = require('./_libs').router;

describe('router unit test', function() {

    describe('router.createProxyOptions', function() {
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
                router: {
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

        describe('without router config', function() {
            it('should return the normal target when router not present in config', function() {
                result = router.createProxyOptions(req, config);
                expect(result.target).to.equal('http://localhost:6000');
                expect(result).not.to.equal(config);            // should return cloned object
                expect(result).to.deep.equal(config);           // clone content should match
                expect(result.changeOrigin).to.be.true;
            });
        });

        describe('with just the host in router config', function() {
            it('should target http://localhost:6001 when for router:"alpha.localhost"', function() {
                req.headers.host = 'alpha.localhost';
                result = router.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6001');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6002 when for router:"beta.localhost"', function() {
                req.headers.host = 'beta.localhost';
                result = router.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6002');
                expect(result.changeOrigin).to.be.true;
            });
        });

        describe('with host and host + path config', function() {
            it('should target http://localhost:6004 without path', function() {
                req.headers.host = 'gamma.localhost';
                result = router.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6004');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6003 exact path match', function() {
                req.headers.host = 'gamma.localhost';
                req.url = '/api';
                result = router.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6003');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6004 when contains path', function() {
                req.headers.host = 'gamma.localhost';
                req.url = '/api/books/123';
                result = router.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6003');
                expect(result.changeOrigin).to.be.true;
            });
        });

        describe('with just the path', function() {
            it('should target http://localhost:6005 with just a path as router config', function() {
                req.url = '/rest';
                result = router.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6005');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6005 with just a path as router config', function() {
                req.url = '/rest/deep/path';
                result = router.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6005');
                expect(result.changeOrigin).to.be.true;
            });

            it('should target http://localhost:6000 path in not present in router config', function() {
                req.url = '/unknow-path';
                result = router.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6000');
                expect(result.changeOrigin).to.be.true;
            });
        });

        describe('matching order of router config', function() {
            it('should return first matching target when similar paths are configured', function() {
                req.url = '/some/specific/path';
                result = router.createProxyOptions(req, configProxyTable);
                expect(result.target).to.equal('http://localhost:6006');
                expect(result.changeOrigin).to.be.true;
            });
        });

    });

});
