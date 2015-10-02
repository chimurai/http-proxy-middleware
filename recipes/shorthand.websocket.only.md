# Shorthand - WebSocket only

This example will create a proxy middleware with websocket shorthand only configuration.

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var proxy = proxyMiddleware('ws://localhost:3000/api');
// equals:
// var proxy = proxyMiddleware('/api', {target:'ws://localhost:3000', ws: true});
```
