var should = require('should');
var utils =  require('../lib/utils');

describe('utils', function () {
    describe('#hasContext(context, url)', function () {

        it('should return true when the context is present in url', function () {
            var result = utils.hasContext('/api', 'http://localhost/api/foo/bar');
            result.should.be.true;
        });

        it('should return false when the context is not present in url', function () {
            var result = utils.hasContext('/abc', 'http://localhost/api/foo/bar');
            result.should.be.false;
        });

        it('should return false when the context is present half way in url', function () {
            var result = utils.hasContext('/foo', 'http://localhost/api/foo/bar');
            result.should.be.false;
        });
    });
});
