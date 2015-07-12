var expect = require('chai').expect;
var contextMatcher = require('../lib/context-matcher');

describe('Single path matching', function () {
    var result;

    it('should return true when the context is present in url', function () {
        result = contextMatcher.match('/api', 'http://localhost/api/foo/bar');
        expect(result).to.be.true;
    });

    it('should return false when the context is not present in url', function () {
        result = contextMatcher.match('/abc', 'http://localhost/api/foo/bar');
        expect(result).to.be.false;
    });

    it('should return false when the context is present half way in url', function () {
        result = contextMatcher.match('/foo', 'http://localhost/api/foo/bar');
        expect(result).to.be.false;
    });

    it('should return false when the context does not start with /', function () {
        result = contextMatcher.match('api', 'http://localhost/api/foo/bar');
        expect(result).to.be.false;
    });
});

describe('Multi path matching', function () {
    var result;

    it('should return true when the context is present in url', function () {
        result = contextMatcher.match(['/api'], 'http://localhost/api/foo/bar');
        expect(result).to.be.true;
    });

    it('should return true when the context is present in url', function () {
        result = contextMatcher.match(['/api', '/ajax'], 'http://localhost/ajax/foo/bar');
        expect(result).to.be.true;
    });

    it('should return false when the context does not match url', function () {
        result = contextMatcher.match(['/api', '/ajax'], 'http://localhost/foo/bar');
        expect(result).to.be.false;
    });

    it('should return false when empty array provided', function () {
        result = contextMatcher.match([], 'http://localhost/api/foo/bar');
        expect(result).to.be.false;
    });

});


describe('Test invalid contexts', function () {
    var testContext;

    beforeEach(function () {
        testContext = function (context) {
            return function () {
                contextMatcher.match(context, 'http://localhost/api/foo/bar');
            };
        };
    });

    it('should throw error with undefined', function () {
        expect(testContext(undefined)).to.throw(Error);
    });

    it('should throw error with null', function () {
        expect(testContext(null)).to.throw(Error);
    });

    it('should throw error with object literal', function () {
        expect(testContext({})).to.throw(Error);
    });

    it('should throw error with integers', function () {
        expect(testContext(123)).to.throw(Error);
    });

    it('should not throw error with string', function () {
        expect(testContext('/123')).not.to.throw(Error);
    });

    it('should not throw error with Array', function () {
        expect(testContext(['/123'])).not.to.throw(Error);
    });

});
