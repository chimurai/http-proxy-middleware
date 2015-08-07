var expect = require('chai').expect;
var contextMatcher = require('../lib/context-matcher');

describe('String path matching', function () {
    var result;

    describe('Single path matching', function () {
        it('should match all paths', function () {
            result = contextMatcher.match('', 'http://localhost/api/foo/bar');
            expect(result).to.be.true;
        });

        it('should match all paths starting with forward-slash', function () {
            result = contextMatcher.match('/', 'http://localhost/api/foo/bar');
            expect(result).to.be.true;
        });

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
});

describe('Wildcard path matching', function () {
    describe('Single glob', function () {
        var url;

        beforeEach(function () {
            url = 'http://localhost/api/foo/bar.html';
        });

        describe('url-path matching', function () {
            it('should match any path', function () {
                expect(contextMatcher.match('**', url)).to.be.true;
                expect(contextMatcher.match('/**', url)).to.be.true;
            });

            it('should only match paths starting with "/api" ', function () {
                expect(contextMatcher.match('/api/**', url)).to.be.true;
                expect(contextMatcher.match('/ajax/**', url)).to.be.false;
            });

            it('should only match paths starting with "foo" folder in it ', function () {
                expect(contextMatcher.match('**/foo/**', url)).to.be.true;
                expect(contextMatcher.match('**/invalid/**', url)).to.be.false;
            });
        });

        describe('file matching', function () {
            it('should match any path, file and extension', function () {
                expect(contextMatcher.match('**', url)).to.be.true;
                expect(contextMatcher.match('**/*', url)).to.be.true;
                expect(contextMatcher.match('**/*.*', url)).to.be.true;
                expect(contextMatcher.match('/**', url)).to.be.true;
                expect(contextMatcher.match('/**.*', url)).to.be.true;
                expect(contextMatcher.match('/**/*', url)).to.be.true;
                expect(contextMatcher.match('/**/*.*', url)).to.be.true;
            });

            it('should only match .html files', function () {
                expect(contextMatcher.match('**/*.html', url)).to.be.true;
                expect(contextMatcher.match('/**.html', url)).to.be.true;
                expect(contextMatcher.match('/**/*.html', url)).to.be.true;
                expect(contextMatcher.match('/**.htm', url)).to.be.false;
                expect(contextMatcher.match('/**.jpg', url)).to.be.false;
            });

            it('should only match .html under root path', function () {
                var pattern = '/*.html';
                expect(contextMatcher.match(pattern, 'http://localhost/index.html')).to.be.true;
                expect(contextMatcher.match(pattern, 'http://localhost/some/path/index.html')).to.be.false;
            });

            it('should only match .php files with query params', function () {
                expect(contextMatcher.match('/**/*.php', 'http://localhost/a/b/c.php?d=e&e=f')).to.be.false;
                expect(contextMatcher.match('/**/*.php?*', 'http://localhost/a/b/c.php?d=e&e=f')).to.be.true;
            });

            it('should only match any file in root path', function () {
                expect(contextMatcher.match('/*', 'http://localhost/bar.html')).to.be.true;
                expect(contextMatcher.match('/*.*', 'http://localhost/bar.html')).to.be.true;
                expect(contextMatcher.match('/*', 'http://localhost/foo/bar.html')).to.be.false;
            });

            it('should only match .html file is in root path', function () {
                expect(contextMatcher.match('/*.html', 'http://localhost/bar.html')).to.be.true;
                expect(contextMatcher.match('/*.html', 'http://localhost/api/foo/bar.html')).to.be.false;
            });

            it('should only match .html files in "foo" folder', function () {
                expect(contextMatcher.match('**/foo/*.html', url)).to.be.true;
                expect(contextMatcher.match('**/bar/*.html', url)).to.be.false;
            });
        });
    });

    describe('Multi glob matching', function () {

        describe('Multiple patterns', function () {
            it('should return true when both path patterns match', function () {
                var pattern = ['/api/**','/ajax/**'];
                expect(contextMatcher.match(pattern, 'http://localhost/api/foo/bar.json')).to.be.true;
                expect(contextMatcher.match(pattern, 'http://localhost/ajax/foo/bar.json')).to.be.true;
                expect(contextMatcher.match(pattern, 'http://localhost/rest/foo/bar.json')).to.be.false;
            });
            it('should return true when both file extensions pattern match', function () {
                var pattern = ['/**.html','/**.jpeg'];
                expect(contextMatcher.match(pattern, 'http://localhost/api/foo/bar.html')).to.be.true;
                expect(contextMatcher.match(pattern, 'http://localhost/api/foo/bar.jpeg')).to.be.true;
                expect(contextMatcher.match(pattern, 'http://localhost/api/foo/bar.gif')).to.be.false;
            });
        });

        describe('Negation patterns', function () {
            it('should not match file extension', function () {
                var url = 'http://localhost/api/foo/bar.html';
                expect(contextMatcher.match(['**', '!**/*.html'], url)).to.be.false;
                expect(contextMatcher.match(['**', '!**/*.json'], url)).to.be.true;
            });
        });
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

    it('should throw error with mixed string and glob pattern', function () {
        expect(testContext(['/api', '!*.html'])).to.throw(Error);
    });

    it('should not throw error with string', function () {
        expect(testContext('/123')).not.to.throw(Error);
    });

    it('should not throw error with Array', function () {
        expect(testContext(['/123'])).not.to.throw(Error);
    });
    it('should not throw error with glob', function () {
        expect(testContext('/**')).not.to.throw(Error);
    });

    it('should not throw error with Array of globs', function () {
        expect(testContext(['/**', '!*.html'])).not.to.throw(Error);
    });

});
