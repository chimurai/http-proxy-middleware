/**
 * Module dependencies.
 */
var express         = require('../../node_modules/express/index'); // require('express');
var proxyMiddleware = require('../../index');                      // require('http-proxy-middleware');

// configure proxy middleware
// context: '/' will proxy all requests
var proxy = proxyMiddleware('/', {
                target: 'http://echo.websocket.org',
                // pathRewrite: {
                //  '^/websocket' : '/socket',          // rewrite path.
                //  '^/removepath' : ''                 // remove path.
                // },
                changeOrigin: true,                     // for vhosted sites, changes host header to match to target's host
                ws: true                                // enable websocket proxy

            });

var app = express();
app.use('/', express.static(__dirname));                // demo page
app.use(proxy);                                         // add the proxy to express

var server = app.listen(3000);
server.on('upgrade', proxy.upgrade);                    // optional: upgrade externally

console.log('listening on port 3000');
console.log('try:');
console.log('  http://localhost:3000 for a demo');
console.log('  ws://localhost:3000 requests will be proxied to ws://echo.websocket.org');

/**
 * Example:
 * Open http://localhost:3000 in WebSocket compatible browser.
 * In browser console:
 * 1. `var socket = new WebSocket('ws://localhost:3000');`          // create new WebSocket
 * 2. `socket.onmessage = function (msg) {console.log(msg)};`       // listen to socket messages
 * 3. `socket.send('hello world');`                                 // send message
 * >  {data: "hello world"}                                         // server should echo back your message.
 **/
