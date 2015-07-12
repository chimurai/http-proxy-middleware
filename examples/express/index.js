/**
 * Module dependencies.
 */
var express         = require('../../node_modules/express/index'); // require('express');
var proxyMiddleware = require('../../index');                      // require('http-proxy-middleware');

// configure proxy middleware
// context: '/' will proxy all requests
//     use: '/api' to proxy request when path starts with '/api'
var proxy = proxyMiddleware('/api', {
                target: 'http://www.example.org',
                changeOrigin: true   // for vhosted sites, changes host header to match to target's host
            });

var app = express();
app.use(proxy);                      // add the proxy to express

app.listen(3000);

console.log('listening on port 3000');
console.log('try:');
console.log('  http://localhost:3000/api');

