# pathRewrite

Rewrite paths before requests are send to the target.

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var options = {
    target: 'http://localhost:3000',
    pathRewrite: {
        "^/old/api" : "/new/api",    // rewrite path
        "^/remove/api" : ""          // remove path
    }
};

var proxy = proxyMiddleware('/api', options);

// `/old/api/foo/bar` -> `http://localhost:3000/new/api/foo/bar`
// `/remove/api/lorum/ipsum` -> `http://localhost:3000/lorum/ipsum`

```
