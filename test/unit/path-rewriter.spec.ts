import { IncomingMessage } from 'node:http';
import { Socket } from 'node:net';

import { beforeEach, describe, expect, it } from 'vitest';

import { createPathRewriter } from '../../src/path-rewriter.js';
import type { PathRewriteConfig } from '../../src/types.js';

describe('Path rewriting', () => {
  const fakeReq = new IncomingMessage(new Socket());
  let rewriter: Exclude<ReturnType<typeof createPathRewriter>, undefined>;
  let result: ReturnType<typeof rewriter>;
  let config: PathRewriteConfig;

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
      rewriter = createPathRewriter(config) as any;
    });

    it('should rewrite path', () => {
      result = rewriter('/api/old/index.json', fakeReq);
      expect(result).toBe('/api/new/index.json');
    });

    it('should remove path', () => {
      result = rewriter('/remove/old/index.json', fakeReq);
      expect(result).toBe('/old/index.json');
    });

    it('should leave path intact', () => {
      result = rewriter('/foo/bar/index.json', fakeReq);
      expect(result).toBe('/foo/bar/index.json');
    });

    it('should not rewrite path when config-key does not match url with test(regex)', () => {
      result = rewriter('/invalid/bar/foo.json', fakeReq);
      expect(result).toBe('/path/new/bar/foo.json');
      expect(result).not.toBe('/invalid/new/bar/foo.json');
    });

    it('should rewrite path when config-key does match url with test(regex)', () => {
      result = rewriter('/valid/foo/bar.json', fakeReq);
      expect(result).toBe('/path/new/foo/bar.json');
    });

    it('should return first match when similar paths are configured', () => {
      result = rewriter('/some/specific/path/bar.json', fakeReq);
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
      rewriter = createPathRewriter(config) as any;
    });

    it('should add base path to requests', () => {
      result = rewriter('/api/books/123', fakeReq);
      expect(result).toBe('/extra/base/path/api/books/123');
    });
  });

  describe('Rewrite function', () => {
    const originalRequestPath = '/123/456';

    it('should return unmodified path', () => {
      rewriter = createPathRewriter((path) => {
        return path;
      }) as any;

      expect(rewriter(originalRequestPath, fakeReq)).toBe('/123/456');
    });

    it('should return alternative path', () => {
      rewriter = createPathRewriter((path) => {
        return '/foo/bar';
      }) as any;

      expect(rewriter(originalRequestPath, fakeReq)).toBe('/foo/bar');
    });

    it('should return replaced path', () => {
      rewriter = createPathRewriter((path) => {
        return path.replace('/456', '/789');
      }) as any;

      expect(rewriter(originalRequestPath, fakeReq)).toBe('/123/789');
    });

    // Same tests as the above three, but async

    it('is async and should return unmodified path', () => {
      rewriter = createPathRewriter(async (path) => path) as any;

      return expect(rewriter(originalRequestPath, fakeReq)).resolves.toBe('/123/456');
    });

    it('is async and should return alternative path', () => {
      rewriter = createPathRewriter(async (path) => '/foo/bar') as any;

      return expect(rewriter(originalRequestPath, fakeReq)).resolves.toBe('/foo/bar');
    });

    it('is async and should return replaced path', () => {
      rewriter = createPathRewriter(async (path) => path.replace('/456', '/789')) as any;

      return expect(rewriter(originalRequestPath, fakeReq)).resolves.toBe('/123/789');
    });
  });

  describe('Invalid configuration', () => {
    let badFn: (cfg?: PathRewriteConfig) => () => void;

    beforeEach(() => {
      badFn = (cfg) => {
        return () => {
          createPathRewriter(cfg);
        };
      };
    });

    it('should return undefined when no config is provided', () => {
      expect(badFn()()).toBeUndefined();
      expect(badFn(null as unknown as PathRewriteConfig)()).toBeUndefined();
      expect(badFn(undefined)()).toBeUndefined();
    });

    it('should throw when bad config is provided', () => {
      expect(badFn(123 as unknown as PathRewriteConfig)).toThrow(Error);
      expect(badFn('abc' as unknown as PathRewriteConfig)).toThrow(Error);
      expect(badFn([] as unknown as PathRewriteConfig)).toThrow(Error);
      expect(badFn([1, 2, 3] as unknown as PathRewriteConfig)).toThrow(Error);
    });

    it('should not throw when empty Object config is provided', () => {
      expect(badFn({})).not.toThrow(Error);
    });

    it('should not throw when function config is provided', () => {
      expect(badFn(() => {})).not.toThrow(Error);
    });

    it('should not throw when async function config is provided', () => {
      expect(badFn((async () => {}) as unknown as any)).not.toThrow(Error);
    });
  });
});
