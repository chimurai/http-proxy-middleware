# WebSocket

This example will create a proxy middleware with websocket support.

```javascript
var proxy = require("http-proxy-middleware");

var socketProxy = proxy('/socket', {target: 'http://localhost:3000', ws: true});
```

## WebSocket - Path Rewrite

This example will create a proxy middleware with websocket support and pathRewrite.

```javascript
var proxy = require("http-proxy-middleware");

var options = {
        target: 'http://localhost:3000',
        ws: true,
        pathRewrite: {
            '^/socket' : ''
        }
    };

var socketProxy = proxy('/socket', options);
```

## WebSocket - Server update subscription

This example will create a proxy middleware with websocket support.

Subscribe to server's upgrade event.

```javascript
var proxy = require("http-proxy-middleware");

var socketProxy = proxy('/socket', {target: 'http://localhost:3000', ws: true});

server.on('upgrade', proxy.upgrade);    // <-- subscribe to http 'upgrade'
```
