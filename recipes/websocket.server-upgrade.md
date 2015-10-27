# WebSocket - Server update subscription

This example will create a proxy middleware with websocket support.

Subscribe to server's upgrade event.

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var proxy = proxyMiddleware('/socket', {target: 'http://localhost:3000', ws: true});

server.on('upgrade', proxy.upgrade);    // <-- subscribe to http 'upgrade'
```
