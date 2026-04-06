import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Filter, Options } from '../../src/index.js';
import { createProxyMiddleware } from './test-kit.js';

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

      const filter: Filter = (pathname, req) => {
        const urlFilter = new RegExp('^/sub/api');
        const match = urlFilter.test(pathname);
        return match;
      };

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

  function jsonMiddleware(data: Record<string, unknown>) {
    return (req: express.Request, res: express.Response) => {
      res.json(data);
    };
  }
});
