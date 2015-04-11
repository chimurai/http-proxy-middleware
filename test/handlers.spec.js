var expect = require('chai').expect;
var handlers =  require('../lib/handlers');


describe('handlers.proxyReqHost(proxyReq, req, res, options)', function () {

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


    it('should set the header: host to match the target host', function () {

        var proxyReq = new ProxyReq();
        handlers.proxyReqHost(proxyReq, {}, {}, proxyReqOptions);

        var result = proxyReq.getHeader('host');

        expect(result).to.equal('localhost.dev');
    });

});

describe('handlers.proxyError(err, req, res, proxyOptions)', function () {

    var mockError = {
        code : 'ECONNREFUSED'
    };


    var mockReq = {
        url : '/api'
    };

    var proxyOptions = {
        target : {
            host : 'localhost.dev'
        }
    };

    var httpErrorCode;
    var errorMessage;

    var mockRes = {
        writeHead : function (v) {
            httpErrorCode = v;
            return v;
        },
        end : function (v) {
            errorMessage = v;
            return v;
        }
    };

    // simulate proxy error
    handlers.proxyError(mockError, mockReq, mockRes, proxyOptions);

    it('should set the http status code to: 500', function () {
        expect(httpErrorCode).to.equal(500);
    });

    it('should end the response and return error message', function () {
        expect(errorMessage).to.equal('Error occured while trying to proxy to: localhost.dev/api');
    });

});
