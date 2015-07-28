/**
 * Module dependencies.
 */
var express         = require('../../node_modules/express/index'); // require('express');
var proxyMiddleware = require('../../index');                      // require('http-proxy-middleware');

// configure proxy middleware
// context: '/' will proxy all requests
var proxy = proxyMiddleware('/', {
                target: 'http://echo.websocket.org',
                // target: 'ws://echo.websocket.org',   // alternative way to provide target with ws:// protocol
                // pathRewrite: {
                //  '^/websocket' : '/socket',          // rewrite path.
                //  '^/removepath' : ''                 // remove path.
                // },
                changeOrigin: true,                     // for vhosted sites, changes host header to match to target's host
                ws: true                                // enable websocket proxy

            });

var app = express();
app.use(proxy);                                         // add the proxy to express

app.listen(3000);

console.log('listening on port 3000');
console.log('try:');
console.log('  ws://localhost:3000 requests will be proxied to ws://echo.websocket.org');

/**
 * Example:
 * Open http://localhost:3000 in WebSocket compatible browser.      // don't mind the 404 page...
 * In browser console:
 * 1. `var socket = new WebSocket('ws://localhost:3000');`          // create new WebSocket
 * 2. `socket.onmessage = function (msg) {console.log(msg)};`       // listen to socket messages
 * 3. `socket.send('hello world')`;                                 // send message
 * >  {data: "hello world"}                                         // server should echo back your message.
 **/
