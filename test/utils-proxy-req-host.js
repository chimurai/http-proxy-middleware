var expect = require('chai').expect;
var proxyReqHost = require('../lib/utils/proxy-req-host');

// Simulate http-proxy's proxyReq
var ProxyReq = function () {
    var headers = {};

    return {
        getHeader : function (key) {
            return headers[key];
        },
        setHeader : function (key, val) {
            headers[key] = val;
        }
    }
};

var proxyReqOptions = {
    target : {
        host : 'localhost.dev'
    }
};

describe('utils#proxyReqHost(proxyReq, req, res, options)', function () {

    it('should set the header: host to match the target host', function () {

        var proxyReq = new ProxyReq();
        proxyReqHost(proxyReq, {}, {}, proxyReqOptions);

        var result = proxyReq.getHeader('host');

        expect(result).to.equal('localhost.dev');
    });

});
