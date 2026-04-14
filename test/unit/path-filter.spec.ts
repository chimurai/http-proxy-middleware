import { beforeEach, describe, expect, it } from 'vitest';

import { matchPathFilter } from '../../src/path-filter.js';
import { createMockRequest } from '../test-utils.js';

describe('Path Filter', () => {
  const mockReq = createMockRequest();

  describe('String path matching', () => {
    let result;

    describe('Single path matching', () => {
      it('should match all paths', () => {
        result = matchPathFilter('', 'http://localhost/api/foo/bar', mockReq);
        expect(result).toBe(true);
      });

      it('should match all paths starting with forward-slash', () => {
        result = matchPathFilter('/', 'http://localhost/api/foo/bar', mockReq);
        expect(result).toBe(true);
      });

      it('should return true when the pathFilter is present in url', () => {
        result = matchPathFilter('/api', 'http://localhost/api/foo/bar', mockReq);
        expect(result).toBe(true);
      });

      it('should return false when the pathFilter is not present in url', () => {
        result = matchPathFilter('/abc', 'http://localhost/api/foo/bar', mockReq);
        expect(result).toBe(false);
      });

      it('should return false when the pathFilter is present half way in url', () => {
        result = matchPathFilter('/foo', 'http://localhost/api/foo/bar', mockReq);
        expect(result).toBe(false);
      });

      it('should return false when the pathFilter does not start with /', () => {
        result = matchPathFilter('api', 'http://localhost/api/foo/bar', mockReq);
        expect(result).toBe(false);
      });
    });

    describe('Multi path matching', () => {
      it('should return true when the pathFilter is present in url', () => {
        result = matchPathFilter(['/api'], 'http://localhost/api/foo/bar', mockReq);
        expect(result).toBe(true);
      });

      it('should return true when the pathFilter is present in url', () => {
        result = matchPathFilter(['/api', '/ajax'], 'http://localhost/ajax/foo/bar', mockReq);
        expect(result).toBe(true);
      });

      it('should return false when the pathFilter does not match url', () => {
        result = matchPathFilter(['/api', '/ajax'], 'http://localhost/foo/bar', mockReq);
        expect(result).toBe(false);
      });

      it('should return false when empty array provided', () => {
        result = matchPathFilter([], 'http://localhost/api/foo/bar', mockReq);
        expect(result).toBe(false);
      });
    });
  });

  describe('Wildcard path matching', () => {
    describe('Single glob', () => {
      let url: string;

      beforeEach(() => {
        url = 'http://localhost/api/foo/bar.html';
      });

      describe('url-path matching', () => {
        it('should match any path', () => {
          expect(matchPathFilter('**', url, mockReq)).toBe(true);
          expect(matchPathFilter('/**', url, mockReq)).toBe(true);
        });

        it('should only match paths starting with "/api" ', () => {
          expect(matchPathFilter('/api/**', url, mockReq)).toBe(true);
          expect(matchPathFilter('/ajax/**', url, mockReq)).toBe(false);
        });

        it('should only match paths starting with "foo" folder in it ', () => {
          expect(matchPathFilter('**/foo/**', url, mockReq)).toBe(true);
          expect(matchPathFilter('**/invalid/**', url, mockReq)).toBe(false);
        });
      });

      describe('file matching', () => {
        it('should match any path, file and extension', () => {
          expect(matchPathFilter('**', url, mockReq)).toBe(true);
          expect(matchPathFilter('**/*', url, mockReq)).toBe(true);
          expect(matchPathFilter('**/*.*', url, mockReq)).toBe(true);
          expect(matchPathFilter('/**', url, mockReq)).toBe(true);
          expect(matchPathFilter('/**/*', url, mockReq)).toBe(true);
          expect(matchPathFilter('/**/*.*', url, mockReq)).toBe(true);
        });

        it('should only match .html files', () => {
          expect(matchPathFilter('**/*.html', url, mockReq)).toBe(true);
          expect(matchPathFilter('/**/*.html', url, mockReq)).toBe(true);
          expect(matchPathFilter('/*.htm', url, mockReq)).toBe(false);
          expect(matchPathFilter('/*.jpg', url, mockReq)).toBe(false);
        });

        it('should only match .html under root path', () => {
          const pattern = '/*.html';
          expect(matchPathFilter(pattern, 'http://localhost/index.html', mockReq)).toBe(true);
          expect(matchPathFilter(pattern, 'http://localhost/some/path/index.html', mockReq)).toBe(
            false,
          );
        });

        it('should ignore query params', () => {
          expect(matchPathFilter('/**/*.php', 'http://localhost/a/b/c.php?d=e&e=f', mockReq)).toBe(
            true,
          );
          expect(
            matchPathFilter('/**/*.php?*', 'http://localhost/a/b/c.php?d=e&e=f', mockReq),
          ).toBe(false);
        });

        it('should only match any file in root path', () => {
          expect(matchPathFilter('/*', 'http://localhost/bar.html', mockReq)).toBe(true);
          expect(matchPathFilter('/*.*', 'http://localhost/bar.html', mockReq)).toBe(true);
          expect(matchPathFilter('/*', 'http://localhost/foo/bar.html', mockReq)).toBe(false);
        });

        it('should only match .html file is in root path', () => {
          expect(matchPathFilter('/*.html', 'http://localhost/bar.html', mockReq)).toBe(true);
          expect(matchPathFilter('/*.html', 'http://localhost/api/foo/bar.html', mockReq)).toBe(
            false,
          );
        });

        it('should only match .html files in "foo" folder', () => {
          expect(matchPathFilter('**/foo/*.html', url, mockReq)).toBe(true);
          expect(matchPathFilter('**/bar/*.html', url, mockReq)).toBe(false);
        });

        it('should not match .html files', () => {
          expect(matchPathFilter('!**/*.html', url, mockReq)).toBe(false);
        });
      });
    });

    describe('Multi glob matching', () => {
      describe('Multiple patterns', () => {
        it('should return true when both path patterns match', () => {
          const pattern = ['/api/**', '/ajax/**'];
          expect(matchPathFilter(pattern, 'http://localhost/api/foo/bar.json', mockReq)).toBe(true);
          expect(matchPathFilter(pattern, 'http://localhost/ajax/foo/bar.json', mockReq)).toBe(
            true,
          );
          expect(matchPathFilter(pattern, 'http://localhost/rest/foo/bar.json', mockReq)).toBe(
            false,
          );
        });
        it('should return true when both file extensions pattern match', () => {
          const pattern = ['/**/*.html', '/**/*.jpeg'];
          expect(matchPathFilter(pattern, 'http://localhost/api/foo/bar.html', mockReq)).toBe(true);
          expect(matchPathFilter(pattern, 'http://localhost/api/foo/bar.jpeg', mockReq)).toBe(true);
          expect(matchPathFilter(pattern, 'http://localhost/api/foo/bar.gif', mockReq)).toBe(false);
        });
      });

      describe('Negation patterns', () => {
        it('should not match file extension', () => {
          const url = 'http://localhost/api/foo/bar.html';
          expect(matchPathFilter(['**', '!**/*.html'], url, mockReq)).toBe(false);
          expect(matchPathFilter(['**', '!**/*.json'], url, mockReq)).toBe(true);
        });
      });
    });
  });

  describe('Use function for matching', () => {
    const testFunctionAsPathFilter = (val: any) => {
      return matchPathFilter(fn, 'http://localhost/api/foo/bar', mockReq);

      function fn(path: string, req: any) {
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
    let testPathFilter: (pathFilter: any) => () => void;

    beforeEach(() => {
      testPathFilter = (pathFilter) => {
        return () => {
          matchPathFilter(pathFilter, 'http://localhost/api/foo/bar', mockReq);
        };
      };
    });

    describe('Throw error', () => {
      it('should throw error with null', () => {
        expect(testPathFilter(null)).toThrow(Error);
      });

      it('should throw error with object literal', () => {
        expect(testPathFilter(mockReq)).toThrow(Error);
      });

      it('should throw error with integers', () => {
        expect(testPathFilter(123)).toThrow(Error);
      });

      it('should throw error with mixed string and glob pattern', () => {
        expect(testPathFilter(['/api', '!*.html'])).toThrow(Error);
      });
    });

    describe('Do not throw error', () => {
      it('should not throw error with string', () => {
        expect(testPathFilter('/123')).not.toThrow(Error);
      });

      it('should not throw error with Array', () => {
        expect(testPathFilter(['/123'])).not.toThrow(Error);
      });
      it('should not throw error with glob', () => {
        expect(testPathFilter('/**')).not.toThrow(Error);
      });

      it('should not throw error with Array of globs', () => {
        expect(testPathFilter(['/**', '!*.html'])).not.toThrow(Error);
      });

      it('should not throw error with Function', () => {
        expect(testPathFilter(() => {})).not.toThrow(Error);
      });
    });
  });
});
