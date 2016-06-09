var expect = require('chai').expect;
var router = require('./_libs').router;

describe('router unit test', function() {
    var req, config, result;

    beforeEach(function() {
        req = {
            headers: {
                host: 'localhost'
            },
            url: '/'
        };

        config = {
            target: 'http://localhost:6000'
        };

    });

    describe('router.getTarget from function', function() {
        var request;

        beforeEach(function() {
            proxyOptionWithRouter = {
                target: 'http://localhost:6000',
                router: function(req) {
                    request = req;
                    return 'http://foobar.com:666';
                }
            };

            result = router.getTarget(req, proxyOptionWithRouter);
        });

        describe('custom dynamic router function', function() {
            it('should provide the request object for dynamic routing', function() {
                expect(request.headers.host).to.equal('localhost');
                expect(request.url).to.equal('/');
            });
            it('should return new target', function() {
                expect(result).to.equal('http://foobar.com:666');
            });
        });
    });

    describe('router.getTarget from table', function() {
        beforeEach(function() {
            proxyOptionWithRouter = {
                target: 'http://localhost:6000',
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
                result = router.getTarget(req, config);
                expect(result).to.equal(undefined);
            });
        });

        describe('with just the host in router config', function() {
            it('should target http://localhost:6001 when for router:"alpha.localhost"', function() {
                req.headers.host = 'alpha.localhost';
                result = router.getTarget(req, proxyOptionWithRouter);
                expect(result).to.equal('http://localhost:6001');
            });

            it('should target http://localhost:6002 when for router:"beta.localhost"', function() {
                req.headers.host = 'beta.localhost';
                result = router.getTarget(req, proxyOptionWithRouter);
                expect(result).to.equal('http://localhost:6002');
            });
        });

        describe('with host and host + path config', function() {
            it('should target http://localhost:6004 without path', function() {
                req.headers.host = 'gamma.localhost';
                result = router.getTarget(req, proxyOptionWithRouter);
                expect(result).to.equal('http://localhost:6004');
            });

            it('should target http://localhost:6003 exact path match', function() {
                req.headers.host = 'gamma.localhost';
                req.url = '/api';
                result = router.getTarget(req, proxyOptionWithRouter);
                expect(result).to.equal('http://localhost:6003');
            });

            it('should target http://localhost:6004 when contains path', function() {
                req.headers.host = 'gamma.localhost';
                req.url = '/api/books/123';
                result = router.getTarget(req, proxyOptionWithRouter);
                expect(result).to.equal('http://localhost:6003');
            });
        });

        describe('with just the path', function() {
            it('should target http://localhost:6005 with just a path as router config', function() {
                req.url = '/rest';
                result = router.getTarget(req, proxyOptionWithRouter);
                expect(result).to.equal('http://localhost:6005');
            });

            it('should target http://localhost:6005 with just a path as router config', function() {
                req.url = '/rest/deep/path';
                result = router.getTarget(req, proxyOptionWithRouter);
                expect(result).to.equal('http://localhost:6005');
            });

            it('should target http://localhost:6000 path in not present in router config', function() {
                req.url = '/unknow-path';
                result = router.getTarget(req, proxyOptionWithRouter);
                expect(result).to.equal(undefined);
            });
        });

        describe('matching order of router config', function() {
            it('should return first matching target when similar paths are configured', function() {
                req.url = '/some/specific/path';
                result = router.getTarget(req, proxyOptionWithRouter);
                expect(result).to.equal('http://localhost:6006');
            });
        });

    });

});
