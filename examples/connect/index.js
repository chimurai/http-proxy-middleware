/**
 * Module dependencies.
 */
const http = require('http');
const connect = require('connect');
const { createProxyMiddleware } = require('../../dist'); // require('http-proxy-middleware');

/**
 * Configure proxy middleware
 */
const jsonPlaceholderProxy = createProxyMiddleware({
  target: 'http://jsonplaceholder.typicode.com',
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
  logLevel: 'debug',
});

const app = connect();

/**
 * Add the proxy to connect
 */
app.use('/users', jsonPlaceholderProxy);

http.createServer(app).listen(3000);

console.log('[DEMO] Server: listening on port 3000');
console.log('[DEMO] Opening: http://localhost:3000/users');

require('open')('http://localhost:3000/users');
