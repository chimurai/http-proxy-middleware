import * as http from 'http';
import { createServer, createProxyMiddleware } from './_utils';

describe('E2E http-proxy-middleware', () => {
  describe('http-proxy-middleware creation', () => {
    it('should create a middleware', () => {
      let middleware;
      middleware = createProxyMiddleware('/api', {
        target: 'http://localhost:8000'
      });
      expect(typeof middleware).toBe('function');
    });
  });

  describe('context matching', () => {
    describe('do not proxy', () => {
      let isSkipped;

      beforeEach(() => {
        isSkipped = false;

        let middleware;

        const mockReq = { url: '/foo/bar', originalUrl: '/foo/bar' };
        const mockRes = {};
        const mockNext = () => {
          // mockNext will be called when request is not proxied
          isSkipped = true;
        };

        middleware = createProxyMiddleware('/api', {
          target: 'http://localhost:8000'
        });
        middleware(mockReq, mockRes, mockNext);
      });

      it('should not proxy requests when request url does not match context', () => {
        expect(isSkipped).toBe(true);
      });
    });
  });

  describe('http-proxy-middleware in actual server', () => {
    describe('basic setup, requests to target', () => {
      let proxyServer;
      let targetServer;
      let targetHeaders;
      let targetUrl;
      let responseBody;

      beforeEach(done => {
        const mwProxy = createProxyMiddleware('/api', {
          target: 'http://localhost:8000'
        });

        const mwTarget = (req, res, next) => {
          targetUrl = req.url; // store target url.
          targetHeaders = req.headers; // store target headers.
          res.write('HELLO WEB'); // respond with 'HELLO WEB'
          res.end();
        };

        proxyServer = createServer(3000, mwProxy);
        targetServer = createServer(8000, mwTarget);

        http.get('http://localhost:3000/api/b/c/dp?q=1&r=[2,3]#s"', res => {
          res.on('data', chunk => {
            responseBody = chunk.toString();
            done();
          });
        });
      });

      afterEach(() => {
        proxyServer.close();
        targetServer.close();
      });

      it('should have the same headers.host value', () => {
        expect(targetHeaders.host).toBe('localhost:3000');
      });

      it('should have proxied the uri-path and uri-query, but not the uri-hash', () => {
        expect(targetUrl).toBe('/api/b/c/dp?q=1&r=[2,3]');
      });

      it('should have response body: "HELLO WEB"', () => {
        expect(responseBody).toBe('HELLO WEB');
      });
    });

    describe('custom context matcher/filter', () => {
      let proxyServer;
      let targetServer;
      let responseBody;

      let filterPath;
      let filterReq;

      beforeEach(done => {
        const filter = (path, req) => {
          filterPath = path;
          filterReq = req;
          return true;
        };

        const mwProxy = createProxyMiddleware(filter, {
          target: 'http://localhost:8000'
        });

        const mwTarget = (req, res, next) => {
          res.write('HELLO WEB'); // respond with 'HELLO WEB'
          res.end();
        };

        proxyServer = createServer(3000, mwProxy);
        targetServer = createServer(8000, mwTarget);

        http.get('http://localhost:3000/api/b/c/d', res => {
          res.on('data', chunk => {
            responseBody = chunk.toString();
            done();
          });
        });
      });

      afterEach(() => {
        proxyServer.close();
        targetServer.close();
      });

      it('should have response body: "HELLO WEB"', () => {
        expect(responseBody).toBe('HELLO WEB');
      });

      it('should provide the url path in the first argument', () => {
        expect(filterPath).toBe('/api/b/c/d');
      });

      it('should provide the req object in the second argument', () => {
        expect(filterReq.method).toBe('GET');
      });
    });

    describe('multi path', () => {
      let proxyServer;
      let targetServer;
      let response;
      let responseBody;

      beforeEach(() => {
        const mwProxy = createProxyMiddleware(['/api', '/ajax'], {
          target: 'http://localhost:8000'
        });

        const mwTarget = (req, res, next) => {
          res.write(req.url); // respond with req.url
          res.end();
        };

        proxyServer = createServer(3000, mwProxy);
        targetServer = createServer(8000, mwTarget);
      });

      afterEach(() => {
        proxyServer.close();
        targetServer.close();
      });

      describe('request to path A, configured', () => {
        beforeEach(done => {
          http.get('http://localhost:3000/api/some/endpoint', res => {
            response = res;
            res.on('data', chunk => {
              responseBody = chunk.toString();
              done();
            });
          });
        });

        it('should proxy to path A', () => {
          expect(response.statusCode).toBe(200);
          expect(responseBody).toBe('/api/some/endpoint');
        });
      });

      describe('request to path B, configured', () => {
        beforeEach(done => {
          http.get('http://localhost:3000/ajax/some/library', res => {
            response = res;
            res.on('data', chunk => {
              responseBody = chunk.toString();
              done();
            });
          });
        });

        it('should proxy to path B', () => {
          expect(response.statusCode).toBe(200);
          expect(responseBody).toBe('/ajax/some/library');
        });
      });

      describe('request to path C, not configured', () => {
        beforeEach(done => {
          http.get('http://localhost:3000/lorum/ipsum', res => {
            response = res;
            res.on('data', chunk => {
              responseBody = chunk.toString();
              done();
            });
          });
        });

        it('should not proxy to this path', () => {
          expect(response.statusCode).toBe(404);
        });
      });
    });

    describe('wildcard path matching', () => {
      let proxyServer;
      let targetServer;
      let response;
      let responseBody;

      beforeEach(() => {
        const mwProxy = createProxyMiddleware('/api/**', {
          target: 'http://localhost:8000'
        });

        const mwTarget = (req, res, next) => {
          res.write(req.url); // respond with req.url
          res.end();
        };

        proxyServer = createServer(3000, mwProxy);
        targetServer = createServer(8000, mwTarget);
      });

      beforeEach(done => {
        http.get('http://localhost:3000/api/some/endpoint', res => {
          response = res;
          res.on('data', chunk => {
            responseBody = chunk.toString();
            done();
          });
        });
      });

      afterEach(() => {
        proxyServer.close();
        targetServer.close();
      });

      it('should proxy to path', () => {
        expect(response.statusCode).toBe(200);
        expect(responseBody).toBe('/api/some/endpoint');
      });
    });

    describe('multi glob wildcard path matching', () => {
      let proxyServer;
      let targetServer;
      let responseA;
      let responseBodyA;
      let responseB;

      beforeEach(() => {
        const mwProxy = createProxyMiddleware(['**/*.html', '!**.json'], {
          target: 'http://localhost:8000'
        });

        const mwTarget = (req, res, next) => {
          res.write(req.url); // respond with req.url
          res.end();
        };

        proxyServer = createServer(3000, mwProxy);
        targetServer = createServer(8000, mwTarget);
      });

      beforeEach(done => {
        http.get('http://localhost:3000/api/some/endpoint/index.html', res => {
          responseA = res;
          res.on('data', chunk => {
            responseBodyA = chunk.toString();
            done();
          });
        });
      });

      beforeEach(done => {
        http.get('http://localhost:3000/api/some/endpoint/data.json', res => {
          responseB = res;
          res.on('data', chunk => {
            done();
          });
        });
      });

      afterEach(() => {
        proxyServer.close();
        targetServer.close();
      });

      it('should proxy to paths ending with *.html', () => {
        expect(responseA.statusCode).toBe(200);
        expect(responseBodyA).toBe('/api/some/endpoint/index.html');
      });

      it('should not proxy to paths ending with *.json', () => {
        expect(responseB.statusCode).toBe(404);
      });
    });

    describe('option.headers - additional request headers', () => {
      let proxyServer;
      let targetServer;
      let targetHeaders;

      beforeEach(done => {
        const mwProxy = createProxyMiddleware('/api', {
          target: 'http://localhost:8000',
          headers: { host: 'foobar.dev' }
        });

        const mwTarget = (req, res, next) => {
          targetHeaders = req.headers;
          res.end();
        };

        proxyServer = createServer(3000, mwProxy);
        targetServer = createServer(8000, mwTarget);

        http.get('http://localhost:3000/api/', res => {
          done();
        });
      });

      afterEach(() => {
        proxyServer.close();
        targetServer.close();
      });

      it('should send request header "host" to target server', () => {
        expect(targetHeaders.host).toBe('foobar.dev');
      });
    });

    describe('option.onError - Error handling', () => {
      let proxyServer;
      let targetServer;
      let response;
      let responseBody;

      describe('default', () => {
        beforeEach(done => {
          const mwProxy = createProxyMiddleware('/api', {
            target: 'http://localhost:666'
          }); // unreachable host on port:666
          const mwTarget = (req, res, next) => {
            next();
          };

          proxyServer = createServer(3000, mwProxy);
          targetServer = createServer(8000, mwTarget);

          http.get('http://localhost:3000/api/', res => {
            response = res;
            done();
          });
        });

        afterEach(() => {
          proxyServer.close();
          targetServer.close();
        });

        it('should handle errors when host is not reachable', () => {
          expect(response.statusCode).toBe(504);
        });
      });

      describe('custom', () => {
        beforeEach(done => {
          const customOnError = (err, req, res) => {
            if (err) {
              res.writeHead(418); // different error code
              res.end("I'm a teapot"); // no response body
            }
          };

          const mwProxy = createProxyMiddleware('/api', {
            target: 'http://localhost:666',
            onError: customOnError
          }); // unreachable host on port:666
          const mwTarget = (req, res, next) => {
            next();
          };

          proxyServer = createServer(3000, mwProxy);
          targetServer = createServer(8000, mwTarget);

          http.get('http://localhost:3000/api/', res => {
            response = res;
            res.on('data', chunk => {
              responseBody = chunk.toString();
              done();
            });
          });
        });

        afterEach(() => {
          proxyServer.close();
          targetServer.close();
        });

        it('should respond with custom http status code', () => {
          expect(response.statusCode).toBe(418);
        });

        it('should respond with custom status message', () => {
          expect(responseBody).toBe("I'm a teapot");
        });
      });
    });

    describe('option.onProxyRes', () => {
      let proxyServer;
      let targetServer;
      let response;

      beforeEach(done => {
        const fnOnProxyRes = (proxyRes, req, res) => {
          proxyRes.headers['x-added'] = 'foobar'; // add custom header to response
          delete proxyRes.headers['x-removed'];
        };

        const mwProxy = createProxyMiddleware('/api', {
          target: 'http://localhost:8000',
          onProxyRes: fnOnProxyRes
        });
        const mwTarget = (req, res, next) => {
          res.setHeader('x-removed', 'remove-header');
          res.write(req.url); // respond with req.url
          res.end();
        };

        proxyServer = createServer(3000, mwProxy);
        targetServer = createServer(8000, mwTarget);

        http.get('http://localhost:3000/api/foo/bar', res => {
          response = res;
          res.on('data', chunk => {
            done();
          });
        });
      });

      afterEach(() => {
        proxyServer.close();
        targetServer.close();
      });

      it('should add `x-added` as custom header to response"', () => {
        expect(response.headers['x-added']).toBe('foobar');
      });

      it('should remove `x-removed` field from response header"', () => {
        expect(response.headers['x-removed']).toBeUndefined();
      });
    });

    describe('option.onProxyReq', () => {
      let proxyServer;
      let targetServer;
      let receivedRequest;

      beforeEach(done => {
        const fnOnProxyReq = (proxyReq, req, res) => {
          proxyReq.setHeader('x-added', 'foobar'); // add custom header to request
        };

        const mwProxy = createProxyMiddleware('/api', {
          target: 'http://localhost:8000',
          onProxyReq: fnOnProxyReq
        });

        const mwTarget = (req, res, next) => {
          receivedRequest = req;
          res.write(req.url); // respond with req.url
          res.end();
        };

        proxyServer = createServer(3000, mwProxy);
        targetServer = createServer(8000, mwTarget);

        http.get('http://localhost:3000/api/foo/bar', () => {
          done();
        });
      });

      afterEach(() => {
        proxyServer.close();
        targetServer.close();
      });

      it('should add `x-added` as custom header to request"', () => {
        expect(receivedRequest.headers['x-added']).toBe('foobar');
      });
    });

    describe('option.pathRewrite', () => {
      let proxyServer;
      let targetServer;
      let responseBody;

      beforeEach(done => {
        const mwProxy = createProxyMiddleware('/api', {
          target: 'http://localhost:8000',
          pathRewrite: {
            '^/api': '/rest',
            '^/remove': ''
          }
        });
        const mwTarget = (req, res, next) => {
          res.write(req.url); // respond with req.url
          res.end();
        };

        proxyServer = createServer(3000, mwProxy);
        targetServer = createServer(8000, mwTarget);

        http.get('http://localhost:3000/api/foo/bar', res => {
          res.on('data', chunk => {
            responseBody = chunk.toString();
            done();
          });
        });
      });

      afterEach(() => {
        proxyServer.close();
        targetServer.close();
      });

      it('should have rewritten path from "/api/foo/bar" to "/rest/foo/bar"', () => {
        expect(responseBody).toBe('/rest/foo/bar');
      });
    });

    describe('shorthand usage', () => {
      let proxyServer;
      let targetServer;
      let responseBody;

      beforeEach(done => {
        const mwProxy = createProxyMiddleware('http://localhost:8000/api');
        const mwTarget = (req, res, next) => {
          res.write(req.url); // respond with req.url
          res.end();
        };

        proxyServer = createServer(3000, mwProxy);
        targetServer = createServer(8000, mwTarget);

        http.get('http://localhost:3000/api/foo/bar', res => {
          res.on('data', chunk => {
            responseBody = chunk.toString();
            done();
          });
        });
      });

      afterEach(() => {
        proxyServer.close();
        targetServer.close();
      });

      it('should have proxy with shorthand configuration', () => {
        expect(responseBody).toBe('/api/foo/bar');
      });
    });

    describe('express with path + proxy', () => {
      let proxyServer;
      let targetServer;
      let responseBody;

      beforeEach(done => {
        const mwProxy = createProxyMiddleware('http://localhost:8000');
        const mwTarget = (req, res, next) => {
          res.write(req.url); // respond with req.url
          res.end();
        };

        proxyServer = createServer(3000, mwProxy, '/api');
        targetServer = createServer(8000, mwTarget);

        http.get('http://localhost:3000/api/foo/bar', res => {
          res.on('data', chunk => {
            responseBody = chunk.toString();
            done();
          });
        });
      });

      afterEach(() => {
        proxyServer.close();
        targetServer.close();
      });

      it('should proxy to target with the baseUrl', () => {
        expect(responseBody).toBe('/api/foo/bar');
      });
    });

    describe('option.logLevel & option.logProvider', () => {
      let proxyServer;
      let targetServer;
      let logMessage;

      beforeEach(done => {
        const customLogger = message => {
          logMessage = message;
        };

        const mwProxy = createProxyMiddleware('http://localhost:8000/api', {
          logLevel: 'info',
          logProvider(provider) {
            provider.debug = customLogger;
            provider.info = customLogger;
            return provider;
          }
        });
        const mwTarget = (req, res, next) => {
          res.write(req.url); // respond with req.url
          res.end();
        };

        proxyServer = createServer(3000, mwProxy);
        targetServer = createServer(8000, mwTarget);

        http.get('http://localhost:3000/api/foo/bar', res => {
          res.on('data', chunk => {
            done();
          });
        });
      });

      afterEach(() => {
        proxyServer.close();
        targetServer.close();
      });

      it('should have logged messages', () => {
        expect(logMessage).not.toBeUndefined();
      });
    });
  });
});
