var expect          = require('chai').expect;
var proxyMiddleware = require('../index');

describe('http-proxy-middleware', function () {

    it('should be a function', function () {
        expect(proxyMiddleware).to.be.a('function');
    });

    it('should create a new proxy', function () {
        proxyMiddleware('/api', {target:'localhost:9000'});
    });

});
