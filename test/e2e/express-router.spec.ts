import * as express from 'express';
import * as http from 'http';
import * as request from 'supertest';

import { Options } from '../../src/index';
import { createProxyMiddleware } from './test-kit';

describe('Usage in Express', () => {
  let app: express.Express;
  let agent: request.Agent;

  beforeEach(() => {
    app = express();
  });

  // https://github.com/chimurai/http-proxy-middleware/issues/94
  describe('Express Sub Route', () => {
    beforeEach(() => {
      // sub route config
      const sub = express.Router();

      function filter(pathname: string, req: http.IncomingMessage) {
        const urlFilter = new RegExp('^/sub/api');
        const match = urlFilter.test(pathname);
        return match;
      }

      /**
       * Mount proxy without 'path' in sub route
       */
      const proxyConfig: Options = {
        changeOrigin: true,
        target: 'http://jsonplaceholder.typicode.com',
        pathFilter: filter,
      };
      sub.use(createProxyMiddleware(proxyConfig));

      sub.get('/hello', jsonMiddleware({ content: 'foobar' }));

      // configure sub route on /sub junction
      app.use('/sub', sub);

      // start server
      agent = request(app);
    });

    it('should still return a response when route does not match proxyConfig', async () => {
      const response = await agent.get('/sub/hello');
      expect(response.body).toEqual({ content: 'foobar' });
    });
  });

  function jsonMiddleware(data: any) {
    return (req: express.Request, res: express.Response) => {
      res.json(data);
    };
  }
});
