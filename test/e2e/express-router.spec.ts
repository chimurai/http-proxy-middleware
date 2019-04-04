import * as express from 'express';
import * as http from 'http';
import { proxyMiddleware as proxy } from './_utils';

describe('Usage in Express', () => {
  let app;
  let server;

  beforeEach(() => {
    app = express();
  });

  afterEach(() => {
    // tslint:disable-next-line: no-unused-expression
    server && server.close();
  });

  // https://github.com/chimurai/http-proxy-middleware/issues/94
  describe('Express Sub Route', () => {
    beforeEach(() => {
      // sub route config
      // @ts-ignore: Only a void function can be called with the 'new' keyword.ts(2350)
      const sub = new express.Router();

      function filter(pathname, req) {
        const urlFilter = new RegExp('^/sub/api');
        const match = urlFilter.test(pathname);
        return match;
      }

      /**
       * Mount proxy without 'path' in sub route
       */
      const proxyConfig = {
        changeOrigin: true,
        logLevel: 'silent',
        target: 'http://jsonplaceholder.typicode.com'
      };
      sub.use(proxy(filter, proxyConfig));

      sub.get('/hello', jsonMiddleware({ content: 'foobar' }));

      // configure sub route on /sub junction
      app.use('/sub', sub);

      // start server
      server = app.listen(3000);
    });

    it('should still return a response when route does not match proxyConfig', done => {
      let responseBody;
      http.get('http://localhost:3000/sub/hello', res => {
        res.on('data', chunk => {
          responseBody = chunk.toString();
          expect(responseBody).toBe('{"content":"foobar"}');
          done();
        });
      });
    });
  });

  function jsonMiddleware(data) {
    return (req, res) => {
      res.json(data);
    };
  }
});
