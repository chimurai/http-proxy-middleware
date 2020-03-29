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

    describe('shorthand String', () => {
      describe('shorthand String config', () => {
        beforeEach(() => {
          result = createConfig('http://www.example.org:8000/api');
        });

        it('should return config object', () => {
          expect(Object.keys(result)).toEqual(['context', 'options']);
        });

        it('should return config object with context', () => {
          expect(result.context).toBe('/api');
        });

        it('should return config object with options', () => {
          expect(result.options).toEqual({
            target: 'http://www.example.org:8000',
          });
        });
      });

      describe('shorthand String config for whole domain', () => {
        beforeEach(() => {
          result = createConfig('http://www.example.org:8000');
        });

        it('should return config object with context', () => {
          expect(result.context).toBe('/');
        });
      });

      describe('shorthand String config for websocket url', () => {
        beforeEach(() => {
          result = createConfig('ws://www.example.org:8000');
        });

        it('should return config object with context', () => {
          expect(result.context).toBe('/');
        });

        it('should return options with ws = true', () => {
          expect(result.options.ws).toBe(true);
        });
      });

      describe('shorthand String config for secure websocket url', () => {
        beforeEach(() => {
          result = createConfig('wss://www.example.org:8000');
        });

        it('should return config object with context', () => {
          expect(result.context).toBe('/');
        });

        it('should return options with ws = true', () => {
          expect(result.options.ws).toBe(true);
        });
      });

      describe('shorthand String config with globbing', () => {
        beforeEach(() => {
          result = createConfig('http://www.example.org:8000/api/*.json');
        });

        it('should return config object with context', () => {
          expect(result.context).toBe('/api/*.json');
        });
      });

      describe('shorthand String config with options', () => {
        beforeEach(() => {
          result = createConfig('http://www.example.org:8000/api', {
            changeOrigin: true,
          });
        });

        it('should return config object with additional options', () => {
          expect(result.options).toEqual({
            changeOrigin: true,
            target: 'http://www.example.org:8000',
          });
        });
      });
    });

    describe('shorthand Object config', () => {
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

      it('should throw an error when target option is missing', () => {
        expect(fn).toThrowError(Error);
      });
    });

    describe('faulty config. mixing classic with shorthand', () => {
      beforeEach(() => {
        result = createConfig('http://localhost:3000/api', {
          target: 'http://localhost:8000',
        });
      });

      it('should use the target in the configuration as target', () => {
        expect(result.options.target).toBe('http://localhost:8000');
      });

      it('should not use the host from the shorthand as target', () => {
        expect(result.options.target).not.toBe('http://localhost:3000');
      });
    });
  });
});
