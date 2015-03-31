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

    it('should set the header: host to match the target host', function () {
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

        proxyError(mockError, mockReq, mockRes, proxyOptions);

        expect(httpErrorCode).to.equal(500);
        expect(errorMessage).to.equal('Error occured while trying to proxy to: localhost.dev/api');
    });

});
