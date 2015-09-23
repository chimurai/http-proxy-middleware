var expect = require('chai').expect;
var handlers =  require('../lib/handlers');

describe('handlers.proxyError(err, req, res, proxyOptions)', function () {

    var mockError = {
        code : 'ECONNREFUSED'
    };

    var mockReq = {
        headers : {
            host : 'localhost:3000'
        },
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
        },
        headersSent : false
    };

    afterEach(function(){
        httpErrorCode = undefined;
        errorMessage = undefined;
    });


    it('should set the http status code to: 500', function () {
        handlers.proxyError(mockError, mockReq, mockRes, proxyOptions);
        expect(httpErrorCode).to.equal(500);
    });

    it('should end the response and return error message', function () {
        handlers.proxyError(mockError, mockReq, mockRes, proxyOptions);
        expect(errorMessage).to.equal('Error occured while trying to proxy to: localhost:3000/api');
    });

    it('should not set the http status code to: 500 if headers have already been sent', function () {
        mockRes.headersSent = true;
        handlers.proxyError(mockError, mockReq, mockRes, proxyOptions);
        expect(httpErrorCode).to.equal(undefined);
    });

    it('should end the response and return error message', function () {
        mockRes.headersSent = true;
        handlers.proxyError(mockError, mockReq, mockRes, proxyOptions);
        expect(errorMessage).to.equal('Error occured while trying to proxy to: localhost:3000/api');
    });

});
