# onProxyRes

Subscribe to http-proxy's [proxyRes event](https://www.npmjs.com/package/http-proxy#listening-for-proxy-events).

```javascript
var proxyMiddleware = require("http-proxy-middleware");

var onProxyRes = function (proxyRes, req, res) {
    // add new header to response
    proxyRes.headers['x-added'] = 'foobar';

    // remove header from response
    delete proxyRes.headers['x-removed'];
};

var options = {target:'http://localhost:3000', onProxyRes: onProxyRes};

var proxy = proxyMiddleware('/api', options);
```
