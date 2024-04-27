/**
 * Module dependencies.
 */
const http = require('node:http');
const { createProxyMiddleware } = require('../../dist'); // require('http-proxy-middleware');

/**
 * Configure proxy middleware
 */
const jsonPlaceholderProxy = createProxyMiddleware({
  target: 'http://jsonplaceholder.typicode.com',
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
  logger: console,
});

/**
 * Add the proxy to http-server
 */
const server = http.createServer(jsonPlaceholderProxy);

server.listen(3000);

console.log('[DEMO] Server: listening on port 3000');
console.log('[DEMO] Opening: http://localhost:3000/users');

require('open')('http://localhost:3000/users');

process.on('SIGINT', () => server.close());
process.on('SIGTERM', () => server.close());
