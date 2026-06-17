import { beforeEach, describe, expect, it } from 'vitest';

import { verifyConfig } from '../../src/configuration.js';
import { HttpProxyMiddlewareError } from '../../src/errors.js';

describe('configFactory', () => {
  describe('verifyConfig()', () => {
    describe('missing option.target', () => {
      let fn: () => void;

      beforeEach(() => {
        fn = () => {
          verifyConfig({ pathFilter: '/api' });
        };
      });

      it('should throw an error when target and router option are missing', () => {
        expect(fn).toThrow(HttpProxyMiddlewareError);
        expect(fn).toThrow(expect.objectContaining({ code: 'ERR_CONFIG_FACTORY_TARGET_MISSING' }));
      });
    });

    describe('optional option.target when option.router is used', () => {
      let fn: () => void;

      beforeEach(() => {
        fn = () => {
          verifyConfig({
            pathFilter: '/api',
            router: (req) => 'http://www.example.com',
          });
        };
      });

      it('should not throw an error when target option is missing when router is used', () => {
        expect(fn).not.toThrow(Error);
      });
    });
  });
});
