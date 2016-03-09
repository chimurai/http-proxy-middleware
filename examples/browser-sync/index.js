/**
 * Module dependencies.
 */
var browserSync     = require('../../node_modules/browser-sync/index').create(); // require('browser-sync').create();
var proxyMiddleware = require('../../index');                           // require('http-proxy-middleware');

// configure proxy middleware
// context: '/' will proxy all requests
//     use: '/api' to proxy request when path starts with '/api'
var proxy = proxyMiddleware('/api', {
                target: 'http://www.example.org',
                changeOrigin: true   // for vhosted sites, changes host header to match to target's host
            });

browserSync.init({
    server: {
        baseDir: './',
        port: 3000,
        middleware: [proxy],         // add the proxy to browser-sync
    },
    startPath: '/api'
});

console.log('listening on port 3000');
console.log('try:');
console.log('  http://localhost:3000/api');
