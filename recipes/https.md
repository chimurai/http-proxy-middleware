# HTTPS

How to proxy requests to various types of HTTPS servers.

All options are provided by [http-proxy](https://github.com/nodejitsu/node-http-proxy).

## Basic proxy to an HTTPS server

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: 'https://example.org',
  changeOrigin: true,
});
```

## Proxy to an HTTPS server using a PKCS12 client certificate

```javascript
const fs = require('fs');
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: {
    protocol: 'https:',
    host: 'example.org',
    port: 443,
    pfx: fs.readFileSync('path/to/certificate.p12'),
    passphrase: 'password',
  },
  changeOrigin: true,
});
```
