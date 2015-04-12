/**
 * Module dependencies.
 */
var http            = require('http');                             // require('http');
var connect         = require('../../node_modules/connect/index'); // require('connect');
var proxyMiddleware = require('../../index');                      // require('http-proxy-middleware');

// configure proxy middleware
// context: '/' will proxy all requests
//     use: '/api' to proxy request when path starts with '/api'
var proxy = proxyMiddleware('/api', {target: 'http://www.example.org'});

var app = connect();
app.use(proxy);

http.createServer(app).listen(3000);

console.log('listening on port 3000');
console.log('try:');
console.log('  http://localhost:3000/api');
