import { type Context, Hono } from 'hono';
import { serve } from '@hono/node-server';
import type { HttpBindings } from '@hono/node-server';
import { RESPONSE_ALREADY_SENT } from '@hono/node-server/utils/response';
import { createProxyMiddleware /* responseInterceptor */ } from '../../dist'; // require('http-proxy-middleware');

/**
 * Use Hono direct response from Node.js API with http-proxy-middleware
 * (https://github.com/honojs/node-server/tree/main?tab=readme-ov-file#direct-response-from-nodejs-api)
 *
 * Hone: return RESPONSE_ALREADY_SENT
 * http-proxy-middleware:
 * - selfHandleResponse: true,
 * - on.proxyRes with responseInterceptor
 */

const proxyMiddleware = createProxyMiddleware({
  target: 'http://jsonplaceholder.typicode.com',
  changeOrigin: true,
  logger: console,
  selfHandleResponse: true,
  on: {
    // proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => responseBuffer),

    // stream response and copy headers
    proxyRes: async (proxyRes, req, res) => {
      res.statusCode = proxyRes.statusCode as number;
      res.statusMessage = proxyRes.statusMessage as string;

      for (const [key, val] of Object.entries(proxyRes.headers)) {
        res.setHeader(key, val as string);
      }

      proxyRes.pipe(res);
    },
  },
});

const honoProxy = async (c: Context<{ Bindings: HttpBindings }>, next) => {
  const { incoming: req, outgoing: res } = c.env;
  proxyMiddleware(req, res, next);
  return RESPONSE_ALREADY_SENT;
};

const app = new Hono<{ Bindings: HttpBindings }>();
app.get('/', (c) => c.text('Hono meets Node.js'));

app.use('/users', honoProxy);

serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`); // Listening on http://localhost:3000

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('open')('http://localhost:3000/users');
});
