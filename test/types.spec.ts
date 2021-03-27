import { createProxyMiddleware as middleware } from '../src';
import { Options } from '../src/types';

describe('http-proxy-middleware TypeScript Types', () => {
  let options: Options;

  beforeEach(() => {
    options = {
      target: 'http://example.org',
    };
  });

  it('should create proxy with just options', () => {
    const proxy = middleware(options);
    expect(proxy).toBeDefined();
  });

  describe('HPM Filters', () => {
    it('should create proxy with path filter', () => {
      const proxy = middleware('/path', options);
      expect(proxy).toBeDefined();
    });

    it('should create proxy with glob filter', () => {
      const proxy = middleware(['/path/**'], options);
      expect(proxy).toBeDefined();
    });

    it('should create proxy with custom filter', () => {
      const proxy = middleware((path, req) => true, options);
      expect(proxy).toBeDefined();
    });

    it('should create proxy with manual websocket upgrade function', () => {
      const proxy = middleware((path, req) => true, options);
      expect(proxy.upgrade).toBeDefined();
    });
  });

  describe('http-proxy options', () => {
    it('should extend from http-proxy options', () => {
      options = {
        target: 'http://example',
        ws: true,
      };
      expect(options).toBeDefined();
    });
  });

  describe('http-proxy-middleware options', () => {
    describe('pathRewrite', () => {
      it('should have pathRewrite Type with table', () => {
        options = { pathRewrite: { '^/from': '/to' } };
        expect(options).toBeDefined();
      });

      it('should have pathRewrite Type with function', () => {
        options = { pathRewrite: (path, req) => '/path' };
        expect(options).toBeDefined();
      });

      it('should have pathRewrite Type with async function', () => {
        options = { pathRewrite: async (path, req) => '/path' };
        expect(options).toBeDefined();
      });
    });

    describe('router', () => {
      it('should have router Type with table', () => {
        options = { router: { '^/from': '/to' } };
        expect(options).toBeDefined();
      });

      it('should have router Type with function', () => {
        options = { router: (path) => '/path' };
        expect(options).toBeDefined();
      });

      it('should have router Type with async function', () => {
        options = { router: async (path) => '/path' };
        expect(options).toBeDefined();
      });
    });

    describe('logLevel', () => {
      it('should have logLevel Type', () => {
        options = { logLevel: 'info' };
        expect(options).toBeDefined();
      });
    });

    describe('logProvider', () => {
      it('should have logProvider Type', () => {
        options = {
          logProvider: (currentProvider) => {
            return {
              log: () => {
                return;
              },
              debug: () => {
                return;
              },
              info: () => {
                return;
              },
              warn: () => {
                return;
              },
              error: () => {
                return;
              },
            };
          },
        };
        expect(options).toBeDefined();
      });
    });

    describe('HPM http-proxy events', () => {
      it('should have onError type', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        options = { onError: (err, req, res) => {} };
        expect(options).toBeDefined();
      });

      it('should have onProxyReq type', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        options = { onProxyReq: (proxyReq, req, res) => {} };
        expect(options).toBeDefined();
      });

      it('should have onProxyRes type', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        options = { onProxyRes: (proxyRes, req, res) => {} };
        expect(options).toBeDefined();
      });

      it('should have onProxyReqWs type', () => {
        options = {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          onProxyReqWs: (proxyReq, req, socket, opts, head) => {},
        };
        expect(options).toBeDefined();
      });

      it('should have onOpen type', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        options = { onOpen: (proxySocket) => {} };
        expect(options).toBeDefined();
      });

      it('should have onClose type', () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        options = { onClose: (res, socket, head) => {} };
        expect(options).toBeDefined();
      });
    });
  });
});
