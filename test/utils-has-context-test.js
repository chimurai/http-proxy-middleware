var expect = require('chai').expect;
var hasContext =  require('../lib/utils/has-context');

describe('utils#hasContext(context, url)', function () {

    it('should return true when the context is present in url', function () {
        var result = hasContext('/api', 'http://localhost/api/foo/bar');
        expect(result).to.be.true;
    });

    it('should return false when the context is not present in url', function () {
        var result = hasContext('/abc', 'http://localhost/api/foo/bar');
        expect(result).to.be.false;
    });

    it('should return false when the context is present half way in url', function () {
        var result = hasContext('/foo', 'http://localhost/api/foo/bar');
        expect(result).to.be.false;
    });
});
