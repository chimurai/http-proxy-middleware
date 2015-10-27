# onProxyReq

Subscribe to http-proxy's [proxyReq event](https://www.npmjs.com/package/http-proxy#listening-for-proxy-events).

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var onProxyReq = function (proxyReq, req, res) {
    // add new header to request
    proxyReq.setHeader('x-added', 'foobar');
};

var options = {target:'http://localhost:3000', onProxyReq: onProxyReq};

var proxy = proxyMiddleware('/api', options);
```
