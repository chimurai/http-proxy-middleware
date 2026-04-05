// @ts-check
/**
 * Module dependencies.
 */
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import open from 'open';

import { createHonoProxyMiddleware } from '../../dist/index.js';

const app = new Hono();

app.use(
  '/users',
  createHonoProxyMiddleware({
    target: 'http://jsonplaceholder.typicode.com',
    changeOrigin: true, // for vhosted sites, changes host header to match to target's host
    logger: console,
  }),
);

console.log('Server is running on http://localhost:3000');

const server = serve(app);

console.log('[DEMO] Server: listening on port 3000');
console.log('[DEMO] Opening: http://localhost:3000/users');

open('http://localhost:3000/users');

process.on('SIGINT', () => server.close());
process.on('SIGTERM', () => server.close());
