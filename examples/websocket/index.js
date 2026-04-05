// @ts-check
/**
 * Module dependencies.
 */
import { fileURLToPath } from 'node:url';

import express from 'express';
import open from 'open';

import { createProxyMiddleware } from '../../dist/index.js';

const currentDir = fileURLToPath(new URL('.', import.meta.url));

/**
 * Configure proxy middleware
 */
const wsProxy = createProxyMiddleware({
  target: 'https://echo.websocket.org',
  // pathRewrite: {
  //  '^/websocket' : '/socket',        // rewrite path.
  //  '^/removepath' : ''               // remove path.
  // },
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
  ws: true, // enable websocket proxy
  logger: console,
});

const app = express();
app.use('/', express.static(currentDir)); // demo page
app.use(wsProxy); // add the proxy to express

const server = app.listen(3000);
server.on('upgrade', wsProxy.upgrade); // optional: upgrade externally

console.log('[DEMO] Server: listening on port 3000');
console.log('[DEMO] Opening: http://localhost:3000');

open('http://localhost:3000');

/**
 * Example:
 * Open http://localhost:3000 in WebSocket compatible browser.
 * In browser console:
 * 1. `const socket = new WebSocket('ws://localhost:3000');`          // create new WebSocket
 * 2. `socket.onmessage = function (msg) {console.log(msg)};`       // listen to socket messages
 * 3. `socket.send('hello world');`                                 // send message
 * >  {data: "hello world"}                                         // server should echo back your message.
 **/
