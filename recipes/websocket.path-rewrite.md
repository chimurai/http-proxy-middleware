# WebSocket - Path Rewrite

This example will create a proxy middleware with websocket support and pathRewrite.

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var options = {
        target: 'http://localhost:3000',
        ws: true,
        pathRewrite: {
            '^/socket' : ''
        }
    };

var proxy = proxyMiddleware('/socket', options);
```
