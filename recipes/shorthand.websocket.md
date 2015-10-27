# Shorthand - WebSocket

This example will create a proxy middleware with shorthand and additional configuration for WebSocket support.

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var proxy = proxyMiddleware('http://localhost:3000/api', {ws: true});
// equals:
// var proxy = proxyMiddleware('/api', {target:'http://localhost:3000', ws: true});
```
