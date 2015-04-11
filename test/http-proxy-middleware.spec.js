var expect          = require('chai').expect;
var proxyMiddleware = require('../index');

describe('http-proxy-middleware', function () {
    it('should create a middleware', function () {
        var middleware;
        middleware = proxyMiddleware('/api', {target:'localhost:9000'});
        expect(middleware).to.be.a('function');
    });
});

describe('http-proxy-middleware ', function () {
    it('should not proxy requests when request url does not match context' , function () {
        var middleware;
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
