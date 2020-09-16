# Corporate Proxy Support

This example will create a basic proxy middleware with corporate proxy support.

Provide a custom `http.agent` with [https-proxy-agent](https://github.com/TooTallNate/node-https-proxy-agent) to connect to the corporate proxy server.

```javascript
const HttpsProxyAgent = require('https-proxy-agent');
const { createProxyMiddleware } = require('http-proxy-middleware');

// corporate proxy to connect to
const proxyServer = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

const options = {
  target: 'http://localhost:3000',
  agent: new HttpsProxyAgent(proxyServer),
};

const apiProxy = createProxyMiddleware('/api', options);
```
