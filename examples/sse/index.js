// @ts-check
/**
 * Module dependencies.
 */
import express from 'express';
import open from 'open';

import { createProxyMiddleware } from '../../dist/index.js';

/**
 * Configure proxy middleware
 */
const sseProxy = createProxyMiddleware({
  target: 'https://sse.dev/test',
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
  logger: console,
});

const app = express();

/**
 * Add the proxy to express
 */
app.use('/test', sseProxy);

const server = app.listen(3000);

console.log('[DEMO] Server: listening on port 3000');
console.log('[DEMO] Opening: http://localhost:3000/test');

open('http://localhost:3000/test');

process.on('SIGINT', () => server.close());
process.on('SIGTERM', () => server.close());
