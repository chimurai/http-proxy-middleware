// @ts-check
/**
 * Module dependencies.
 */
import express from 'express';
import open from 'open';

import { createProxyMiddleware } from '#http-proxy-middleware';

/**
 * Configure proxy middleware
 */
const sseProxy = createProxyMiddleware({
  target: 'https://streaming.dexpaprika.com/sse',
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
  logger: console,
});

const app = express();

/**
 * Add the proxy to express
 */
app.use('/sse', sseProxy);

const server = app.listen(3000);

/**
 * Free public SSE endpoint (no API key required): https://docs.dexpaprika.com
 * Streams live WETH price events on Ethereum.
 */
const demoUrl =
  'http://localhost:3000/sse/prices?method=token_price&chain=ethereum&address=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

console.log('[DEMO] Server: listening on port 3000');
console.log(`[DEMO] Opening: ${demoUrl}`);

open(demoUrl);

process.on('SIGINT', () => server.close());
process.on('SIGTERM', () => server.close());
