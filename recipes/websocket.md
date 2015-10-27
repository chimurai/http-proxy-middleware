# WebSocket

This example will create a proxy middleware with websocket support.

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var proxy = proxyMiddleware('/socket', {target: 'http://localhost:3000', ws: true});
```
