# Context - Multi Wildcard

This example will create a proxy middleware with wildcard context matching.

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var proxy = proxyMiddleware(['/api/**', '/ajax/**'], {target: 'http://localhost:3000'});
```
