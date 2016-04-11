/**
 * Module dependencies.
 */
var express = require('express');
var proxy = require('../../index'); // require('http-proxy-middleware');

/**
 * Configure proxy middleware
 */
var wsProxy = proxy('/', {
                target: 'http://echo.websocket.org',
                // pathRewrite: {
                //  '^/websocket' : '/socket',          // rewrite path.
                //  '^/removepath' : ''                 // remove path.
                // },
                changeOrigin: true,                     // for vhosted sites, changes host header to match to target's host
                ws: true,                               // enable websocket proxy
                logLevel: 'debug'
            });

var app = express();
app.use('/', express.static(__dirname));                // demo page
app.use(wsProxy);                                       // add the proxy to express

var server = app.listen(3000);
server.on('upgrade', wsProxy.upgrade);                  // optional: upgrade externally


console.log('[DEMO] Server: listening on port 3000');
console.log('[DEMO] Opening: http://localhost:3000');

require('open')('http://localhost:3000');

/**
 * Example:
 * Open http://localhost:3000 in WebSocket compatible browser.
 * In browser console:
 * 1. `var socket = new WebSocket('ws://localhost:3000');`          // create new WebSocket
 * 2. `socket.onmessage = function (msg) {console.log(msg)};`       // listen to socket messages
 * 3. `socket.send('hello world');`                                 // send message
 * >  {data: "hello world"}                                         // server should echo back your message.
 **/
