// file deepcode ignore DisablePoweredBy: example code
// file deepcode ignore UseCsurfForExpress: example code

/**
 * Module dependencies.
 */
const express = require('express');
const { createProxyMiddleware, responseInterceptor } = require('../../dist'); // require('http-proxy-middleware');

// test with double-byte characters
// cSpell:ignore Kroket, ส้มตำไทย, चिकन
const favoriteFoods = [
  {
    country: 'NL',
    food: 'Kroket',
  },
  {
    country: 'HK',
    food: '叉燒包',
  },
  {
    country: 'US',
    food: 'Hamburger',
  },
  {
    country: 'TH',
    food: 'ส้มตำไทย',
  },
  {
    country: 'IN',
    food: 'बटर चिकन',
  },
];

/**
 * Configure proxy middleware
 */
const jsonPlaceholderProxy = createProxyMiddleware({
  target: 'http://jsonplaceholder.typicode.com',
  router: {
    '/users': 'http://jsonplaceholder.typicode.com',
    '/brotli': 'http://httpbin.org',
    '/gzip': 'http://httpbin.org',
    '/deflate': 'http://httpbin.org',
  },
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
  selfHandleResponse: true, // manually call res.end(); IMPORTANT: res.end() is called internally by responseInterceptor()
  on: {
    proxyRes: responseInterceptor(async (buffer, proxyRes, req, res) => {
      // log original response
      // console.log(`[DEBUG] original response:\n${buffer.toString('utf8')}`);

      console.log('change response content-type');
      res.setHeader('content-type', 'application/json; charset=utf-8');

      console.log('change response status code');
      res.statusCode = 418;

      console.log('return a complete different response');
      return JSON.stringify(favoriteFoods);
    }),
  },
  logger: console,
});

const app = express();

/**
 * Add the proxy to express
 */
app.use(jsonPlaceholderProxy);

const server = app.listen(3000);

console.log('[DEMO] Server: listening on port 3000');
console.log('[DEMO] Open: http://localhost:3000/users');
console.log('[DEMO] Open: http://localhost:3000/brotli');
console.log('[DEMO] Open: http://localhost:3000/gzip');
console.log('[DEMO] Open: http://localhost:3000/deflate');

require('open')('http://localhost:3000/users');

process.on('SIGINT', () => server.close());
process.on('SIGTERM', () => server.close());
