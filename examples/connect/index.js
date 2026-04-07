// @ts-check
/**
 * Module dependencies.
 */
import * as http from 'node:http';

import connect from 'connect';
import open from 'open';

import { createProxyMiddleware } from '#http-proxy-middleware';

/**
 * Configure proxy middleware
 */
const jsonPlaceholderProxy = createProxyMiddleware({
  target: 'http://jsonplaceholder.typicode.com/users',
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
});

const app = connect();

/**
 * Add the proxy to connect
 */
app.use('/users', jsonPlaceholderProxy);

const server = http.createServer(app).listen(3000);

console.log('[DEMO] Server: listening on port 3000');
console.log('[DEMO] Opening: http://localhost:3000/users');

open('http://localhost:3000/users');

process.on('SIGINT', () => server.close());
process.on('SIGTERM', () => server.close());
