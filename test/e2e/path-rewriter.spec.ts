import http from 'http';
import { createServer, proxyMiddleware } from './_utils';

describe('E2E pathRewrite', () => {
  let targetMiddleware;
  let targetData;

  beforeEach(() => {
    targetData = {};
    targetMiddleware = (req, res, next) => {
      targetData.url = req.url; // store target url.
      targetData.headers = req.headers; // store target headers.
      res.write(req.url); // respond with target url.
      res.end();
    };
  });

  let proxyServer;
  let targetServer;

  beforeEach(() => {
    targetServer = createServer(8000, targetMiddleware);
  });

  afterEach(() => {
    // tslint:disable-next-line: no-unused-expression
    proxyServer && proxyServer.close();
    targetServer.close();
  });

  describe('Rewrite paths with rules table', () => {
    beforeEach(() => {
      const proxyConfig = {
        target: 'http://localhost:8000',
        pathRewrite: {
          '^/foobar/api/': '/api/'
        }
      };
      const proxy = proxyMiddleware(proxyConfig);
      proxyServer = createServer(3000, proxy);
    });

    beforeEach(done => {
      http.get('http://localhost:3000/foobar/api/lorum/ipsum', res => {
        done();
      });
    });

    it('should remove "/foobar" from path', () => {
      expect(targetData.url).toBe('/api/lorum/ipsum');
    });
  });

  describe('Rewrite paths with function', () => {
    let originalPath;
    let pathRewriteReqObject;

    beforeEach(() => {
      const proxyConfig = {
        target: 'http://localhost:8000',
        pathRewrite(path, req) {
          originalPath = path;
          pathRewriteReqObject = req;
          return path.replace('/foobar', '');
        }
      };
      const proxy = proxyMiddleware(proxyConfig);
      proxyServer = createServer(3000, proxy);
    });

    beforeEach(done => {
      http.get('http://localhost:3000/foobar/api/lorum/ipsum', res => {
        done();
      });
    });

    it('should remove "/foobar" from path', () => {
      expect(targetData.url).toBe('/api/lorum/ipsum');
    });

    it('should provide the `path` parameter with the unmodified path value', () => {
      expect(originalPath).toBe('/foobar/api/lorum/ipsum');
    });

    it('should provide the `req` object as second parameter of the rewrite function', () => {
      expect(pathRewriteReqObject.method).toBe('GET');
      expect(pathRewriteReqObject.url).toBe('/api/lorum/ipsum');
    });
  });
});
