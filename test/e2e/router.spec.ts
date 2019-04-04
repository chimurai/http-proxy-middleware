import * as http from 'http';
import { createServer, proxyMiddleware } from './_utils';

describe('E2E router', () => {
  let proxyServer;
  let targetServerA;
  let targetServerB;
  let targetServerC;

  beforeEach(() => {
    targetServerA = createServer(6001, (req, res, next) => {
      res.write('A');
      res.end();
    });

    targetServerB = createServer(6002, (req, res, next) => {
      res.write('B');
      res.end();
    });

    targetServerC = createServer(6003, (req, res, next) => {
      res.write('C');
      res.end();
    });
  });

  afterEach(() => {
    targetServerA.close();
    targetServerB.close();
    targetServerC.close();
  });

  describe('router with proxyTable', () => {
    beforeEach(() => {
      proxyServer = createServer(
        6000,
        proxyMiddleware({
          target: 'http://localhost:6001',
          router(req) {
            return 'http://localhost:6003';
          }
        })
      );
    });

    afterEach(() => {
      proxyServer.close();
    });

    it('should proxy to: "localhost:6003/api"', done => {
      const options = { hostname: 'localhost', port: 6000, path: '/api' };
      http.get(options, res => {
        res.on('data', chunk => {
          const responseBody = chunk.toString();
          expect(responseBody).toBe('C');
          done();
        });
      });
    });
  });

  describe('router with proxyTable', () => {
    beforeEach(function setupServers() {
      proxyServer = createServer(
        6000,
        proxyMiddleware('/', {
          target: 'http://localhost:6001',
          router: {
            'alpha.localhost:6000': 'http://localhost:6001',
            'beta.localhost:6000': 'http://localhost:6002',
            'localhost:6000/api': 'http://localhost:6003'
          }
        })
      );
    });

    afterEach(() => {
      proxyServer.close();
    });

    it('should proxy to option.target', done => {
      http.get('http://localhost:6000', res => {
        res.on('data', chunk => {
          const responseBody = chunk.toString();
          expect(responseBody).toBe('A');
          done();
        });
      });
    });

    it('should proxy when host is "alpha.localhost"', done => {
      const options = { hostname: 'localhost', port: 6000, path: '/' } as any;
      options.headers = { host: 'alpha.localhost:6000' };
      http.get(options, res => {
        res.on('data', chunk => {
          const responseBody = chunk.toString();
          expect(responseBody).toBe('A');
          done();
        });
      });
    });

    it('should proxy when host is "beta.localhost"', done => {
      const options = { hostname: 'localhost', port: 6000, path: '/' } as any;
      options.headers = { host: 'beta.localhost:6000' };
      http.get(options, res => {
        res.on('data', chunk => {
          const responseBody = chunk.toString();
          expect(responseBody).toBe('B');
          done();
        });
      });
    });

    it('should proxy with host & path config: "localhost:6000/api"', done => {
      const options = { hostname: 'localhost', port: 6000, path: '/api' };
      http.get(options, res => {
        res.on('data', chunk => {
          const responseBody = chunk.toString();
          expect(responseBody).toBe('C');
          done();
        });
      });
    });
  });
});
