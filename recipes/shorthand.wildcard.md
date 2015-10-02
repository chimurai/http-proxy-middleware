# Shorthand - Wildcard context

This example will create a proxy middleware with shorthand wildcard context.

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var proxy = proxyMiddleware('http://localhost:3000/api/books/*/**.json');
// equals:
// var proxy = proxyMiddleware('/api/books/*/**.json', {target:'http://localhost:3000'});
```
