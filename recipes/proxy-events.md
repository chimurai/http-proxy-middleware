# Proxy Events

Subscribe to `httpxy` events: `error`, `proxyReq`, `proxyReqWs`, `proxyRes`, `open`, `close`, `start`, `end`, `econnreset`.

## on.error

Subscribe to httpxy's [error event](https://github.com/unjs/httpxy#events).

```javascript
import { createProxyMiddleware } from 'http-proxy-middleware';

const onError = function (err, req, res) {
  console.log('Something went wrong.');
  console.log('And we are reporting a custom error message.');
};

const options = {
  target: 'http://localhost:3000',
  on: { error: onError },
};

const apiProxy = createProxyMiddleware(options);
```

## on.proxyReq

Subscribe to httpxy's [proxyReq event](https://github.com/unjs/httpxy#events).

```javascript
import { createProxyMiddleware } from 'http-proxy-middleware';

const onProxyReq = function (proxyReq, req, res) {
  // add new header to request
  proxyReq.setHeader('x-added', 'foobar');
};

const options = {
  target: 'http://localhost:3000',
  on: { proxyReq: onProxyReq },
};

const apiProxy = createProxyMiddleware(options);
```

## on.proxyReqWs

Subscribe to httpxy's [proxyReqWs event](https://github.com/unjs/httpxy#events).

```javascript
import { createProxyMiddleware } from 'http-proxy-middleware';

const onProxyReqWs = function (proxyReq, req, socket, options, head) {
  // add custom header
  proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
};

const options = {
  target: 'http://localhost:3000',
  on: { proxyReqWs: onProxyReqWs },
};

const apiProxy = createProxyMiddleware(options);
```

## on.proxyRes

Subscribe to httpxy's [proxyRes event](https://github.com/unjs/httpxy#events).

```javascript
import { createProxyMiddleware } from 'http-proxy-middleware';

const onProxyRes = function (proxyRes, req, res) {
  // add new header to response
  proxyRes.headers['x-added'] = 'foobar';

  // remove header from response
  delete proxyRes.headers['x-removed'];
};

const options = {
  target: 'http://localhost:3000',
  on: { proxyRes: onProxyRes },
};

const apiProxy = createProxyMiddleware(options);
```
