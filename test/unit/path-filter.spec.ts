import { matchPathFilter } from '../../src/path-filter';
import { IncomingMessage } from 'http';

describe('Path Filter', () => {
  let fakeReq = {
    url: 'http://localhost/api/foo/bar',
  } as IncomingMessage;

  const asRequest = (url: string) =>
    ({
      ...fakeReq,
      url,
    } as IncomingMessage);

  describe('String path matching', () => {
    let result;

    describe('Single path matching', () => {
      it('should match all paths', () => {
        result = matchPathFilter('', fakeReq);
        expect(result).toBe(true);
      });

      it('should match all paths starting with forward-slash', () => {
        result = matchPathFilter('/', fakeReq);
        expect(result).toBe(true);
      });

      it('should return true when the pathFilter is present in url', () => {
        result = matchPathFilter('/api', fakeReq);
        expect(result).toBe(true);
      });

      it('should return false when the pathFilter is not present in url', () => {
        result = matchPathFilter('/abc', fakeReq);
        expect(result).toBe(false);
      });

      it('should return false when the pathFilter is present half way in url', () => {
        result = matchPathFilter('/foo', fakeReq);
        expect(result).toBe(false);
      });

      it('should return false when the pathFilter does not start with /', () => {
        result = matchPathFilter('api', fakeReq);
        expect(result).toBe(false);
      });
    });

    describe('Multi path matching', () => {
      it('should return true when the pathFilter is present in url', () => {
        result = matchPathFilter(['/api'], fakeReq);
        expect(result).toBe(true);
      });

      it('should return true when the pathFilter is present in url', () => {
        result = matchPathFilter(['/api', '/ajax'], asRequest('http://localhost/ajax/foo/bar'));
        expect(result).toBe(true);
      });

      it('should return false when the pathFilter does not match url', () => {
        result = matchPathFilter(['/api', '/ajax'], asRequest('http://localhost/foo/bar'));
        expect(result).toBe(false);
      });

      it('should return false when empty array provided', () => {
        result = matchPathFilter([], fakeReq);
        expect(result).toBe(false);
      });
    });
  });

  describe('Wildcard path matching', () => {
    describe('Single glob', () => {
      beforeEach(() => {
        fakeReq = asRequest('http://localhost/api/foo/bar.html');
      });

      describe('url-path matching', () => {
        it('should match any path', () => {
          expect(matchPathFilter('**', fakeReq)).toBe(true);
          expect(matchPathFilter('/**', fakeReq)).toBe(true);
        });

        it('should only match paths starting with "/api" ', () => {
          expect(matchPathFilter('/api/**', fakeReq)).toBe(true);
          expect(matchPathFilter('/ajax/**', fakeReq)).toBe(false);
        });

        it('should only match paths starting with "foo" folder in it ', () => {
          expect(matchPathFilter('**/foo/**', fakeReq)).toBe(true);
          expect(matchPathFilter('**/invalid/**', fakeReq)).toBe(false);
        });
      });

      describe('file matching', () => {
        it('should match any path, file and extension', () => {
          expect(matchPathFilter('**', fakeReq)).toBe(true);
          expect(matchPathFilter('**/*', fakeReq)).toBe(true);
          expect(matchPathFilter('**/*.*', fakeReq)).toBe(true);
          expect(matchPathFilter('/**', fakeReq)).toBe(true);
          expect(matchPathFilter('/**/*', fakeReq)).toBe(true);
          expect(matchPathFilter('/**/*.*', fakeReq)).toBe(true);
        });

        it('should only match .html files', () => {
          expect(matchPathFilter('**/*.html', fakeReq)).toBe(true);
          expect(matchPathFilter('/**/*.html', fakeReq)).toBe(true);
          expect(matchPathFilter('/*.htm', fakeReq)).toBe(false);
          expect(matchPathFilter('/*.jpg', fakeReq)).toBe(false);
        });

        it('should only match .html under root path', () => {
          const pattern = '/*.html';
          expect(matchPathFilter(pattern, asRequest('http://localhost/index.html'))).toBe(true);
          expect(matchPathFilter(pattern, asRequest('http://localhost/some/path/index.html'))).toBe(
            false
          );
        });

        it('should ignore query params', () => {
          expect(
            matchPathFilter('/**/*.php', asRequest('http://localhost/a/b/c.php?d=e&e=f'))
          ).toBe(true);
          expect(
            matchPathFilter('/**/*.php?*', asRequest('http://localhost/a/b/c.php?d=e&e=f'))
          ).toBe(false);
        });

        it('should only match any file in root path', () => {
          expect(matchPathFilter('/*', asRequest('http://localhost/bar.html'))).toBe(true);
          expect(matchPathFilter('/*.*', asRequest('http://localhost/bar.html'))).toBe(true);
          expect(matchPathFilter('/*', asRequest('http://localhost/foo/bar.html'))).toBe(false);
        });

        it('should only match .html file is in root path', () => {
          expect(matchPathFilter('/*.html', asRequest('http://localhost/bar.html'))).toBe(true);
          expect(
            matchPathFilter('/*.html', {
              ...fakeReq,
              url: 'http://localhost/api/foo/bar.html',
            } as IncomingMessage)
          ).toBe(false);
        });

        it('should only match .html files in "foo" folder', () => {
          expect(matchPathFilter('**/foo/*.html', fakeReq)).toBe(true);
          expect(matchPathFilter('**/bar/*.html', fakeReq)).toBe(false);
        });

        it('should not match .html files', () => {
          expect(matchPathFilter('!**/*.html', fakeReq)).toBe(false);
        });
      });
    });

    describe('Multi glob matching', () => {
      describe('Multiple patterns', () => {
        it('should return true when both path patterns match', () => {
          const pattern = ['/api/**', '/ajax/**'];
          expect(matchPathFilter(pattern, asRequest('http://localhost/api/foo/bar.json'))).toBe(
            true
          );
          expect(matchPathFilter(pattern, asRequest('http://localhost/ajax/foo/bar.json'))).toBe(
            true
          );
          expect(matchPathFilter(pattern, asRequest('http://localhost/rest/foo/bar.json'))).toBe(
            false
          );
        });
        it('should return true when both file extensions pattern match', () => {
          const pattern = ['/**/*.html', '/**/*.jpeg'];
          expect(matchPathFilter(pattern, asRequest('http://localhost/api/foo/bar.html'))).toBe(
            true
          );
          expect(matchPathFilter(pattern, asRequest('http://localhost/api/foo/bar.jpeg'))).toBe(
            true
          );
          expect(matchPathFilter(pattern, asRequest('http://localhost/api/foo/bar.gif'))).toBe(
            false
          );
        });
      });

      describe('Negation patterns', () => {
        it('should not match file extension', () => {
          const url = 'http://localhost/api/foo/bar.html';
          expect(matchPathFilter(['**', '!**/*.html'], asRequest(url))).toBe(false);
          expect(matchPathFilter(['**', '!**/*.json'], asRequest(url))).toBe(true);
        });
      });
    });
  });

  describe('Use function for matching', () => {
    const testFunctionAsPathFilter = (val) => {
      return matchPathFilter(fn, fakeReq);

      function fn(path, req) {
        return val;
      }
    };

    describe('truthy', () => {
      it('should match when function returns true', () => {
        expect(testFunctionAsPathFilter(true)).toBeTruthy();
        expect(testFunctionAsPathFilter('true')).toBeTruthy();
      });
    });

    describe('falsy', () => {
      it('should not match when function returns falsy value', () => {
        expect(testFunctionAsPathFilter(undefined)).toBeFalsy();
        expect(testFunctionAsPathFilter(false)).toBeFalsy();
        expect(testFunctionAsPathFilter('')).toBeFalsy();
      });
    });
  });

  describe('Test invalid pathFilters', () => {
    let testPathFilter;

    beforeEach(() => {
      testPathFilter = (pathFilter) => {
        return () => {
          matchPathFilter(pathFilter, fakeReq);
        };
      };
    });

    describe('Throw error', () => {
      it('should throw error with null', () => {
        expect(testPathFilter(null)).toThrowError(Error);
      });

      it('should throw error with object literal', () => {
        expect(testPathFilter(fakeReq)).toThrowError(Error);
      });

      it('should throw error with integers', () => {
        expect(testPathFilter(123)).toThrowError(Error);
      });

      it('should throw error with mixed string and glob pattern', () => {
        expect(testPathFilter(['/api', '!*.html'])).toThrowError(Error);
      });
    });

    describe('Do not throw error', () => {
      it('should not throw error with string', () => {
        expect(testPathFilter('/123')).not.toThrowError(Error);
      });

      it('should not throw error with Array', () => {
        expect(testPathFilter(['/123'])).not.toThrowError(Error);
      });
      it('should not throw error with glob', () => {
        expect(testPathFilter('/**')).not.toThrowError(Error);
      });

      it('should not throw error with Array of globs', () => {
        expect(testPathFilter(['/**', '!*.html'])).not.toThrowError(Error);
      });

      it('should not throw error with Function', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        expect(testPathFilter(() => {})).not.toThrowError(Error);
      });
    });
  });
});
