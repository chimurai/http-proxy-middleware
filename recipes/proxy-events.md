# Proxy Events

Subscribe to [`http-proxy`](https://github.com/nodejitsu/node-http-proxy) [![GitHub stars](https://img.shields.io/github/stars/nodejitsu/node-http-proxy.svg?style=social&label=Star)](https://github.com/nodejitsu/node-http-proxy) events: `error`, `proxyReq`, `proxyReqWs`, `proxyRes`, `open`, `close`.

## onError

Subscribe to http-proxy's [error event](https://www.npmjs.com/package/http-proxy#listening-for-proxy-events).

```javascript
var proxy = require("http-proxy-middleware");

var onError = function (err, req, res) {
    console.log('Something went wrong.');
    console.log('And we are reporting a custom error message.');
};

var options = {target:'http://localhost:3000', onError: onError};

var apiProxy = proxy('/api', options);
```

## onProxyReq

Subscribe to http-proxy's [proxyReq event](https://www.npmjs.com/package/http-proxy#listening-for-proxy-events).

```javascript
var proxy = require("http-proxy-middleware");

var onProxyReq = function (proxyReq, req, res) {
    // add new header to request
    proxyReq.setHeader('x-added', 'foobar');
};

var options = {target:'http://localhost:3000', onProxyReq: onProxyReq};

var apiProxy = proxy('/api', options);
```

## onProxyReqWs

Subscribe to http-proxy's [proxyReqWs event](https://www.npmjs.com/package/http-proxy#listening-for-proxy-events).

```javascript
var proxy = require("http-proxy-middleware");

var onProxyReqWs = function (proxyReq, req, socket, options, head) {
    // add custom header
    proxyReq.setHeader('X-Special-Proxy-Header', 'foobar');
};

var options = {target:'http://localhost:3000', onProxyReq: onProxyReqWs};

var apiProxy = proxy('/api', options);
```

## onProxyRes

Subscribe to http-proxy's [proxyRes event](https://www.npmjs.com/package/http-proxy#listening-for-proxy-events).

```javascript
var proxy = require("http-proxy-middleware");

var onProxyRes = function (proxyRes, req, res) {
    // add new header to response
    proxyRes.headers['x-added'] = 'foobar';

    // remove header from response
    delete proxyRes.headers['x-removed'];
};

var options = {target:'http://localhost:3000', onProxyRes: onProxyRes};

var apiProxy = proxy('/api', options);
```
