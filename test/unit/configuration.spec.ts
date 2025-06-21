import { verifyConfig } from '../../src/configuration';

describe('configFactory', () => {
  describe('verifyConfig()', () => {
    describe('missing option.target', () => {
      let fn;

      beforeEach(() => {
        fn = () => {
          verifyConfig({ pathFilter: '/api' });
        };
      });

      it('should throw an error when target and router option are missing', () => {
        expect(fn).toThrow(Error);
      });
    });

    describe('optional option.target when option.router is used', () => {
      let fn;

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
