# WebSocket

Examples to use `http-proxy-middleware` with WebSocket support.

- [WebSocket - `ws:true` flag (automatic upgrade subscription)](#websocket---wstrue-flag-automatic-upgrade-subscription)
- [WebSocket - Manual server upgrade subscription](#websocket---manual-server-upgrade-subscription)
- [Multiple WebSocket targets](#multiple-websocket-targets)
- [WebSocket - Path Rewrite](#websocket---path-rewrite)

## WebSocket - `ws:true` flag (automatic upgrade subscription)

⚠️ NOTE: Using `ws: true` requires an initial regular HTTP request, so HPM can subscribe to the server upgrade event internally.

⚠️ NOTE: If the same middleware is attached to multiple servers, each server needs its own initial HTTP request before auto upgrade subscription is active.

💡 Use `server.on('upgrade', proxy.upgrade)` without the need of an initial HTTP request.

```javascript
import { createProxyMiddleware } from 'http-proxy-middleware';

const socketProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  ws: true,
});
```

## WebSocket - Manual server upgrade subscription

Manually subscribe to server's upgrade event.

```javascript
import { createProxyMiddleware } from 'http-proxy-middleware';

const socketProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  pathFilter: '/socket',
  ws: true,
});

server.on('upgrade', socketProxy.upgrade); // <-- subscribe to http 'upgrade'
```

## Multiple WebSocket targets

Mount each websocket proxy with different target on its own route.

```javascript
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();

const wsProxyA = createProxyMiddleware({
  target: 'http://localhost:4001',
  pathFilter: '/ws-path-a',
  ws: true,
});

const wsProxyB = createProxyMiddleware({
  target: 'http://localhost:4002',
  pathFilter: '/ws-path-b',
  ws: true,
});

app.use('/ws-path-a', wsProxyA);
app.use('/ws-path-b', wsProxyB);
```

## WebSocket - Path Rewrite

This example will create a proxy middleware with websocket support and pathRewrite.

```javascript
import { createProxyMiddleware } from 'http-proxy-middleware';

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
