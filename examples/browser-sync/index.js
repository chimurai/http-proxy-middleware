/**
 * Module dependencies.
 */
var browserSync = require('browser-sync').create();
var proxy = require('../../index'); // require('http-proxy-middleware');

/**
 * Configure proxy middleware
 */
var ChuckNorrisProxy = proxy('/jokes', {
    target: 'http://api.icndb.com',
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
        middleware: [ChuckNorrisProxy],
    },
    startPath: '/jokes/random/5?limitTo=[nerdy]'
});

console.log('[DEMO] Server: listening on port 3000');
console.log('[DEMO] Opening: http://localhost:3000/jokes/random/5?limitTo=[nerdy]');
