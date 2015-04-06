var expect          = require('chai').expect;
var proxyMiddleware = require('../index');

describe('http-proxy-middleware', function () {
    var middleware;

    it('should be a function', function () {
        expect(proxyMiddleware).to.be.a('function');
    });

    it('should create a proxy middleware', function () {
        middleware = proxyMiddleware('/api', {target:'localhost:9000'});
        expect(middleware).to.be.a('function');
    });

    it('should not proxy requests when request url does not match middleware context' , function () {
        var skipped = false;

        var mockReq = {url:'/foo/bar'};
        var mockRes = {};
        var mockNext = function () {
            // mockNext will be called when request is not proxied
            skipped = true;
        };

        middleware = proxyMiddleware('/api', {target:'localhost:9000'});
        middleware(mockReq, mockRes, mockNext);
        expect(skipped).to.be.true;
    });

});
