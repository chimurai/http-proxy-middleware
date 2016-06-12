/**
 * Module dependencies.
 */
var browserSync = require('browser-sync').create();
var proxy = require('../../index'); // require('http-proxy-middleware');

/**
 * Configure proxy middleware
 */
var jsonPlaceholderProxy = proxy('/users', {
    target: 'http://jsonplaceholder.typicode.com',
    changeOrigin: true,             // for vhosted sites, changes host header to match to target's host
    logLevel: 'debug'
});

/**
 * Add the proxy to browser-sync
 */
browserSync.init({
    server: {
        baseDir: './',
        port: 3000,
        middleware: [jsonPlaceholderProxy],
    },
    startPath: '/users'
});

console.log('[DEMO] Server: listening on port 3000');
console.log('[DEMO] Opening: http://localhost:3000/users');
