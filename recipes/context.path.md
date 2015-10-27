# Context - Path

This example will create a basic proxy middleware.

Requests with path `/api` will be proxied to `http://localhost:3000`

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var proxy = proxyMiddleware('/api', {target: 'http://localhost:3000'});

// `/api/foo/bar` -> `http://localhost:3000/api/foo/bar`
```
