import * as contextMatcher from '../../src/context-matcher';

describe('Context Matching', () => {
  const fakeReq = {};

  describe('String path matching', () => {
    let result;

    describe('Single path matching', () => {
      it('should match all paths', () => {
        result = contextMatcher.match('', 'http://localhost/api/foo/bar', fakeReq);
        expect(result).toBe(true);
      });

      it('should match all paths starting with forward-slash', () => {
        result = contextMatcher.match('/', 'http://localhost/api/foo/bar', fakeReq);
        expect(result).toBe(true);
      });

      it('should return true when the context is present in url', () => {
        result = contextMatcher.match('/api', 'http://localhost/api/foo/bar', fakeReq);
        expect(result).toBe(true);
      });

      it('should return false when the context is not present in url', () => {
        result = contextMatcher.match('/abc', 'http://localhost/api/foo/bar', fakeReq);
        expect(result).toBe(false);
      });

      it('should return false when the context is present half way in url', () => {
        result = contextMatcher.match('/foo', 'http://localhost/api/foo/bar', fakeReq);
        expect(result).toBe(false);
      });

      it('should return false when the context does not start with /', () => {
        result = contextMatcher.match('api', 'http://localhost/api/foo/bar', fakeReq);
        expect(result).toBe(false);
      });
    });

    describe('Multi path matching', () => {
      it('should return true when the context is present in url', () => {
        result = contextMatcher.match(['/api'], 'http://localhost/api/foo/bar', fakeReq);
        expect(result).toBe(true);
      });

      it('should return true when the context is present in url', () => {
        result = contextMatcher.match(['/api', '/ajax'], 'http://localhost/ajax/foo/bar', fakeReq);
        expect(result).toBe(true);
      });

      it('should return false when the context does not match url', () => {
        result = contextMatcher.match(['/api', '/ajax'], 'http://localhost/foo/bar', fakeReq);
        expect(result).toBe(false);
      });

      it('should return false when empty array provided', () => {
        result = contextMatcher.match([], 'http://localhost/api/foo/bar', fakeReq);
        expect(result).toBe(false);
      });
    });
  });

  describe('Wildcard path matching', () => {
    describe('Single glob', () => {
      let url;

      beforeEach(() => {
        url = 'http://localhost/api/foo/bar.html';
      });

      describe('url-path matching', () => {
        it('should match any path', () => {
          expect(contextMatcher.match('**', url, fakeReq)).toBe(true);
          expect(contextMatcher.match('/**', url, fakeReq)).toBe(true);
        });

        it('should only match paths starting with "/api" ', () => {
          expect(contextMatcher.match('/api/**', url, fakeReq)).toBe(true);
          expect(contextMatcher.match('/ajax/**', url, fakeReq)).toBe(false);
        });

        it('should only match paths starting with "foo" folder in it ', () => {
          expect(contextMatcher.match('**/foo/**', url, fakeReq)).toBe(true);
          expect(contextMatcher.match('**/invalid/**', url, fakeReq)).toBe(false);
        });
      });

      describe('file matching', () => {
        it('should match any path, file and extension', () => {
          expect(contextMatcher.match('**', url, fakeReq)).toBe(true);
          expect(contextMatcher.match('**/*', url, fakeReq)).toBe(true);
          expect(contextMatcher.match('**/*.*', url, fakeReq)).toBe(true);
          expect(contextMatcher.match('/**', url, fakeReq)).toBe(true);
          expect(contextMatcher.match('/**/*', url, fakeReq)).toBe(true);
          expect(contextMatcher.match('/**/*.*', url, fakeReq)).toBe(true);
        });

        it('should only match .html files', () => {
          expect(contextMatcher.match('**/*.html', url, fakeReq)).toBe(true);
          expect(contextMatcher.match('/**/*.html', url, fakeReq)).toBe(true);
          expect(contextMatcher.match('/*.htm', url, fakeReq)).toBe(false);
          expect(contextMatcher.match('/*.jpg', url, fakeReq)).toBe(false);
        });

        it('should only match .html under root path', () => {
          const pattern = '/*.html';
          expect(contextMatcher.match(pattern, 'http://localhost/index.html', fakeReq)).toBe(true);
          expect(
            contextMatcher.match(pattern, 'http://localhost/some/path/index.html', fakeReq)
          ).toBe(false);
        });

        it('should ignore query params', () => {
          expect(
            contextMatcher.match('/**/*.php', 'http://localhost/a/b/c.php?d=e&e=f', fakeReq)
          ).toBe(true);
          expect(
            contextMatcher.match('/**/*.php?*', 'http://localhost/a/b/c.php?d=e&e=f', fakeReq)
          ).toBe(false);
        });

        it('should only match any file in root path', () => {
          expect(contextMatcher.match('/*', 'http://localhost/bar.html', fakeReq)).toBe(true);
          expect(contextMatcher.match('/*.*', 'http://localhost/bar.html', fakeReq)).toBe(true);
          expect(contextMatcher.match('/*', 'http://localhost/foo/bar.html', fakeReq)).toBe(false);
        });

        it('should only match .html file is in root path', () => {
          expect(contextMatcher.match('/*.html', 'http://localhost/bar.html', fakeReq)).toBe(true);
          expect(
            contextMatcher.match('/*.html', 'http://localhost/api/foo/bar.html', fakeReq)
          ).toBe(false);
        });

        it('should only match .html files in "foo" folder', () => {
          expect(contextMatcher.match('**/foo/*.html', url, fakeReq)).toBe(true);
          expect(contextMatcher.match('**/bar/*.html', url, fakeReq)).toBe(false);
        });

        it('should not match .html files', () => {
          expect(contextMatcher.match('!**/*.html', url, fakeReq)).toBe(false);
        });
      });
    });

    describe('Multi glob matching', () => {
      describe('Multiple patterns', () => {
        it('should return true when both path patterns match', () => {
          const pattern = ['/api/**', '/ajax/**'];
          expect(contextMatcher.match(pattern, 'http://localhost/api/foo/bar.json', fakeReq)).toBe(
            true
          );
          expect(contextMatcher.match(pattern, 'http://localhost/ajax/foo/bar.json', fakeReq)).toBe(
            true
          );
          expect(contextMatcher.match(pattern, 'http://localhost/rest/foo/bar.json', fakeReq)).toBe(
            false
          );
        });
        it('should return true when both file extensions pattern match', () => {
          const pattern = ['/**/*.html', '/**/*.jpeg'];
          expect(contextMatcher.match(pattern, 'http://localhost/api/foo/bar.html', fakeReq)).toBe(
            true
          );
          expect(contextMatcher.match(pattern, 'http://localhost/api/foo/bar.jpeg', fakeReq)).toBe(
            true
          );
          expect(contextMatcher.match(pattern, 'http://localhost/api/foo/bar.gif', fakeReq)).toBe(
            false
          );
        });
      });

      describe('Negation patterns', () => {
        it('should not match file extension', () => {
          const url = 'http://localhost/api/foo/bar.html';
          expect(contextMatcher.match(['**', '!**/*.html'], url, fakeReq)).toBe(false);
          expect(contextMatcher.match(['**', '!**/*.json'], url, fakeReq)).toBe(true);
        });
      });
    });
  });

  describe('Use function for matching', () => {
    const testFunctionAsContext = (val) => {
      return contextMatcher.match(fn, 'http://localhost/api/foo/bar', fakeReq);

      function fn(path, req) {
        return val;
      }
    };

    describe('truthy', () => {
      it('should match when function returns true', () => {
        expect(testFunctionAsContext(true)).toBeTruthy();
        expect(testFunctionAsContext('true')).toBeTruthy();
      });
    });

    describe('falsy', () => {
      it('should not match when function returns falsy value', () => {
        expect(testFunctionAsContext(undefined)).toBeFalsy();
        expect(testFunctionAsContext(false)).toBeFalsy();
        expect(testFunctionAsContext('')).toBeFalsy();
      });
    });
  });

  describe('Test invalid contexts', () => {
    let testContext;

    beforeEach(() => {
      testContext = (context) => {
        return () => {
          contextMatcher.match(context, 'http://localhost/api/foo/bar', fakeReq);
        };
      };
    });

    describe('Throw error', () => {
      it('should throw error with undefined', () => {
        expect(testContext(undefined)).toThrowError(Error);
      });

      it('should throw error with null', () => {
        expect(testContext(null)).toThrowError(Error);
      });

      it('should throw error with object literal', () => {
        expect(testContext(fakeReq)).toThrowError(Error);
      });

      it('should throw error with integers', () => {
        expect(testContext(123)).toThrowError(Error);
      });

      it('should throw error with mixed string and glob pattern', () => {
        expect(testContext(['/api', '!*.html'])).toThrowError(Error);
      });
    });

    describe('Do not throw error', () => {
      it('should not throw error with string', () => {
        expect(testContext('/123')).not.toThrowError(Error);
      });

      it('should not throw error with Array', () => {
        expect(testContext(['/123'])).not.toThrowError(Error);
      });
      it('should not throw error with glob', () => {
        expect(testContext('/**')).not.toThrowError(Error);
      });

      it('should not throw error with Array of globs', () => {
        expect(testContext(['/**', '!*.html'])).not.toThrowError(Error);
      });

      it('should not throw error with Function', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        expect(testContext(() => {})).not.toThrowError(Error);
      });
    });
  });
});
