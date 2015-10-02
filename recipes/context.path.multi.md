# Context - Multi Path

This example will create a basic proxy middleware.

Requests with path `/api` and `/rest` will be proxied to `http://localhost:3000`

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var proxy = proxyMiddleware(['/api', '/rest'], {target: 'http://localhost:3000'});

// `/api/foo/bar` -> `http://localhost:3000/api/foo/bar`
// `/rest/lorum/ipsum` -> `http://localhost:3000/rest/lorum/ipsum`
```
