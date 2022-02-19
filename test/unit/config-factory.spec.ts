import { createConfig } from '../../src/config-factory';

describe('configFactory', () => {
  let result;
  // var createConfig = configFactory.createConfig;

  describe('createConfig()', () => {
    describe('classic config', () => {
      const context = '/api';
      const options = { target: 'http://www.example.org' };

      beforeEach(() => {
        result = createConfig(context, options);
      });

      it('should return config object', () => {
        expect(Object.keys(result)).toEqual(['context', 'options']);
      });

      it('should return config object with context', () => {
        expect(result.context).toBe(context);
      });

      it('should return config object with options', () => {
        expect(result.options).toEqual(options);
      });
    });

    describe('Object config', () => {
      beforeEach(() => {
        result = createConfig({ target: 'http://www.example.org:8000' });
      });

      it('should set the proxy path to everything', () => {
        expect(result.context).toBe('/');
      });

      it('should return config object', () => {
        expect(result.options).toEqual({
          target: 'http://www.example.org:8000',
        });
      });
    });

    describe('missing option.target', () => {
      let fn;

      beforeEach(() => {
        fn = () => {
          createConfig('/api');
        };
      });

      it('should throw an error when target and router option are missing', () => {
        expect(fn).toThrowError(Error);
      });
    });

    describe('optional option.target when option.router is used', () => {
      let fn;

      beforeEach(() => {
        fn = () => {
          createConfig('/api', {
            router: (req) => 'http://www.example.com',
          });
        };
      });

      it('should not throw an error when target option is missing when router is used', () => {
        expect(fn).not.toThrowError(Error);
      });
    });
  });
});
