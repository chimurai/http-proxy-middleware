var expect = require('chai').expect;
var pathRewriter = require('../lib/path-rewriter');

describe('Path rewriting', function () {
    var rewriter;
    var result;

    describe('Configuration and usage', function () {
        beforeEach(function () {
            var config = {
                '^/api/old' : '/api/new',
                '^/remove' : '',
                'invalid' : 'path/new',
                '/valid' : '/path/new'
            };
            rewriter = pathRewriter.create(config);
        });

        it('should rewrite path', function () {
            result = rewriter('/api/old/index.json');
            expect(result).to.equal('/api/new/index.json');
        });

        it('should remove path', function () {
            result = rewriter('/remove/old/index.json');
            expect(result).to.equal('/old/index.json');
        });

        it('should leave path intact', function () {
            result = rewriter('/foo/bar/index.json');
            expect(result).to.equal('/foo/bar/index.json');
        });

        it('should not rewrite path when config-key does not match url with test(regex)', function () {
            result = rewriter('/invalid/bar/foo.json');
            expect(result).to.equal('/path/new/bar/foo.json');
            expect(result).to.not.equal('/invalid/new/bar/foo.json');
        });

        it('should rewrite path when config-key does match url with test(regex)', function () {
            result = rewriter('/valid/foo/bar.json');
            expect(result).to.equal('/path/new/foo/bar.json');
        });
    });

    describe('Invalid configuration', function () {
        var badFn;

        beforeEach(function () {
            badFn = function (config) {
                return function () {
                    pathRewriter.create(config);
                };
            };
        });

        it('should throw when bad config is provided', function () {
            expect(badFn()).to.throw(Error);
            expect(badFn(null)).to.throw(Error);
            expect(badFn(undefined)).to.throw(Error);
            expect(badFn(123)).to.throw(Error);
            expect(badFn("abc")).to.throw(Error);
            expect(badFn(function(){})).to.throw(Error);
            expect(badFn([])).to.throw(Error);
            expect(badFn([1,2,3])).to.throw(Error);
        });

        it('should not throw when empty Object config is provided', function () {
            expect(badFn({})).to.not.throw(Error);
        });

    });
});

