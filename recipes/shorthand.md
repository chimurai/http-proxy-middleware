# Shorthand

This example will create a proxy middleware using the shorthand notation.

The http-proxy-middleware `context` and `config.target` will be set automatically.

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var proxy = proxyMiddleware('http://localhost:3000/api');

// equivalent:
// var proxy = proxyMiddleware('/api', {target:'http://localhost:3000'});
```
