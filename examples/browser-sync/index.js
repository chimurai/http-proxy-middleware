/**
 * Module dependencies.
 */
import browserSync from 'browser-sync';

import { createProxyMiddleware } from '../../dist/index.js';

const app = browserSync.create();

/**
 * Configure proxy middleware
 */
const jsonPlaceholderProxy = createProxyMiddleware({
  target: 'http://jsonplaceholder.typicode.com',
  pathFilter: '/users',
  changeOrigin: true, // for vhosted sites, changes host header to match to target's host
  logger: console,
});

/**
 * Add the proxy to browser-sync
 */
app.init({
  server: {
    baseDir: './',
    middleware: [jsonPlaceholderProxy],
  },
  port: 3000,
  startPath: '/users',
});

console.log('[DEMO] Server: listening on port 3000');
console.log('[DEMO] Opening: http://localhost:3000/users');

process.on('SIGINT', () => app.exit());
process.on('SIGTERM', () => app.exit());
