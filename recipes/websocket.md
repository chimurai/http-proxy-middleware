# WebSocket

This example will create a proxy middleware with websocket support.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const socketProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  pathFilter: '/socket',
  ws: true,
});
```

## WebSocket - Path Rewrite

This example will create a proxy middleware with websocket support and pathRewrite.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const options = {
  target: 'http://localhost:3000',
  ws: true,
  pathFilter: '/socket',
  pathRewrite: {
    '^/socket': '',
  },
};

const socketProxy = createProxyMiddleware(options);
```

## WebSocket - Server update subscription

This example will create a proxy middleware with websocket support.

Subscribe to server's upgrade event.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const socketProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  pathFilter: '/socket',
  ws: true,
});

server.on('upgrade', proxy.upgrade); // <-- subscribe to http 'upgrade'
```
