# Shorthand

This example will create a proxy middleware with shorthand and additional configuration.

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var proxy = proxyMiddleware('http://localhost:3000/api', {changeOrigin: true});
// equals:
// var proxy = proxyMiddleware('/api', {target:'http://localhost:3000', {changeOrigin:true}});
```
