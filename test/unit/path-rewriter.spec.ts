import { createPathRewriter } from '../../src/path-rewriter';

describe('Path rewriting', () => {
  let rewriter;
  let result;
  let config;

  describe('Rewrite rules configuration and usage', () => {
    beforeEach(() => {
      config = {
        '^/api/old': '/api/new',
        '^/remove': '',
        invalid: 'path/new',
        '/valid': '/path/new',
        '/some/specific/path': '/awe/some/specific/path',
        '/some': '/awe/some',
      };
    });

    beforeEach(() => {
      rewriter = createPathRewriter(config);
    });

    it('should rewrite path', () => {
      result = rewriter('/api/old/index.json');
      expect(result).toBe('/api/new/index.json');
    });

    it('should remove path', () => {
      result = rewriter('/remove/old/index.json');
      expect(result).toBe('/old/index.json');
    });

    it('should leave path intact', () => {
      result = rewriter('/foo/bar/index.json');
      expect(result).toBe('/foo/bar/index.json');
    });

    it('should not rewrite path when config-key does not match url with test(regex)', () => {
      result = rewriter('/invalid/bar/foo.json');
      expect(result).toBe('/path/new/bar/foo.json');
      expect(result).not.toBe('/invalid/new/bar/foo.json');
    });

    it('should rewrite path when config-key does match url with test(regex)', () => {
      result = rewriter('/valid/foo/bar.json');
      expect(result).toBe('/path/new/foo/bar.json');
    });

    it('should return first match when similar paths are configured', () => {
      result = rewriter('/some/specific/path/bar.json');
      expect(result).toBe('/awe/some/specific/path/bar.json');
    });
  });

  describe('Rewrite rule: add base path to requests', () => {
    beforeEach(() => {
      config = {
        '^/': '/extra/base/path/',
      };
    });

    beforeEach(() => {
      rewriter = createPathRewriter(config);
    });

    it('should add base path to requests', () => {
      result = rewriter('/api/books/123');
      expect(result).toBe('/extra/base/path/api/books/123');
    });
  });

  describe('Rewrite function', () => {
    beforeEach(() => {
      rewriter = (fn) => {
        const rewriteFn = createPathRewriter(fn);
        const requestPath = '/123/456';
        return rewriteFn(requestPath);
      };
    });

    it('should return unmodified path', () => {
      const rewriteFn = (path) => {
        return path;
      };

      expect(rewriter(rewriteFn)).toBe('/123/456');
    });

    it('should return alternative path', () => {
      const rewriteFn = (path) => {
        return '/foo/bar';
      };

      expect(rewriter(rewriteFn)).toBe('/foo/bar');
    });

    it('should return replaced path', () => {
      const rewriteFn = (path) => {
        return path.replace('/456', '/789');
      };

      expect(rewriter(rewriteFn)).toBe('/123/789');
    });

    // Same tests as the above three, but async

    it('is async and should return unmodified path', () => {
      const rewriteFn = async (path) => {
        const promise = new Promise((resolve, reject) => {
          resolve(path);
        });
        const changed = await promise;
        return changed;
      };

      expect(rewriter(rewriteFn)).resolves.toBe('/123/456');
    });

    it('is async and should return alternative path', () => {
      const rewriteFn = async (path) => {
        const promise = new Promise((resolve, reject) => {
          resolve('/foo/bar');
        });
        const changed = await promise;
        return changed;
      };

      expect(rewriter(rewriteFn)).resolves.toBe('/foo/bar');
    });

    it('is async and should return replaced path', () => {
      const rewriteFn = async (path) => {
        const promise = new Promise((resolve, reject) => {
          resolve(path.replace('/456', '/789'));
        });
        const changed = await promise;
        return changed;
      };

      expect(rewriter(rewriteFn)).resolves.toBe('/123/789');
    });
  });

  describe('Invalid configuration', () => {
    let badFn;

    beforeEach(() => {
      badFn = (cfg) => {
        return () => {
          createPathRewriter(cfg);
        };
      };
    });

    it('should return undefined when no config is provided', () => {
      expect(badFn()()).toBeUndefined();
      expect(badFn(null)()).toBeUndefined();
      expect(badFn(undefined)()).toBeUndefined();
    });

    it('should throw when bad config is provided', () => {
      expect(badFn(123)).toThrowError(Error);
      expect(badFn('abc')).toThrowError(Error);
      expect(badFn([])).toThrowError(Error);
      expect(badFn([1, 2, 3])).toThrowError(Error);
    });

    it('should not throw when empty Object config is provided', () => {
      expect(badFn({})).not.toThrowError(Error);
    });

    it('should not throw when function config is provided', () => {
      // tslint:disable-next-line: no-empty
      expect(badFn(() => {})).not.toThrowError(Error);
    });

    it('should not throw when async function config is provided', () => {
      // tslint:disable-next-line: no-empty
      expect(badFn(async () => {})).not.toThrowError(Error);
    });
  });
});
