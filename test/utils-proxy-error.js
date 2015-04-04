var expect = require('chai').expect;
var proxyError = require('../lib/utils/proxy-error');

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

describe('utils#proxyError(err, req, res, proxyOptions)', function () {

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
    proxyError(mockError, mockReq, mockRes, proxyOptions);

    it('should set the http status code to: 500', function () {
        expect(httpErrorCode).to.equal(500);
    });

    it('should end the response and return error message', function () {
        expect(errorMessage).to.equal('Error occured while trying to proxy to: localhost.dev/api');
    });

});
