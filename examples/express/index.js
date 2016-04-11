/**
 * Module dependencies.
 */
var express = require('express');
var proxy = require('../../index'); // require('http-proxy-middleware');

/**
 * Configure proxy middleware
 */
var chuckNorrisApiProxy = proxy('/jokes', {
    target: 'http://api.icndb.com',
    changeOrigin: true,             // for vhosted sites, changes host header to match to target's host
    logLevel: 'debug'
});

var app = express();

/**
 * Add the proxy to express
 */
app.use(chuckNorrisApiProxy);

app.listen(3000);

console.log('[DEMO] Server: listening on port 3000');
console.log('[DEMO] Opening: http://localhost:3000/api');

require('open')('http://localhost:3000/jokes/random/5?limitTo=[nerdy]');
