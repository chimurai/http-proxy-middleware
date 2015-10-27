# Corporate Proxy Support

This example will create a basic proxy middleware with corporate proxy support.

```javascript
var HttpProxyAgent = require('http-proxy-agent');
var proxyMiddleware = require("http-proxy-middleware");

var proxyServer = process.env.HTTPS_PROXY ||
                  process.env.HTTP_PROXY;

var options = {
    target: 'http://localhost:3000',
    agent: new HttpProxyAgent(proxyServer)
};

var proxy = proxyMiddleware('/api', options);
```
