# pathRewrite

Rewrite paths before requests are send to the target.

## Path rewrite
```javascript
var proxyMiddleware = require("http-proxy-middleware");

var options = {
    target: 'http://localhost:3000',
    pathRewrite: {
        "^/old/api" : "/new/api"    // rewrite path
    }
};

var proxy = proxyMiddleware('/api', options);

// `/old/api/foo/bar` -> `http://localhost:3000/new/api/foo/bar`
```

## Remove base path 
```javascript
var proxyMiddleware = require("http-proxy-middleware");

var options = {
    target: 'http://localhost:3000',
    pathRewrite: {
        "^/remove/api" : ""          // remove base path
    }
};

var proxy = proxyMiddleware('/api', options);

// `/remove/api/lorum/ipsum` -> `http://localhost:3000/lorum/ipsum`
```

## Add base path 
```javascript
var proxyMiddleware = require("http-proxy-middleware");

var options = {
    target: 'http://localhost:3000',
    pathRewrite: {
        "^/" : "/extra/"          // add base path
    }
};

var proxy = proxyMiddleware('/api', options);

// `/api/lorum/ipsum` -> `http://localhost:3000/extra/api/lorum/ipsum`
```
