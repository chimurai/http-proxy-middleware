# Basic usage

This example will create a basic proxy middleware.

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var proxy = proxyMiddleware('/api', {target: 'http://localhost:3000'});
//                          \____/  \________________________________/
//                            |                     |
//                          context              options
```
