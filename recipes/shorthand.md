# Shorthand

This example will create a proxy middleware using the shorthand notation.

The http-proxy-middleware `context` and `config.target` will be set automatically.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware('http://localhost:3000/api');

// equivalent:
// const apiProxy = createProxyMiddleware('/api', {target:'http://localhost:3000'});
```

## Shorthand - Wildcard context

This example will create a proxy middleware with shorthand wildcard context.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware('http://localhost:3000/api/books/*/**.json');
// equals:
// const apiProxy = createProxyMiddleware('/api/books/*/**.json', {target:'http://localhost:3000'});
```

## Shorthand with additional configuration

This example will create a proxy middleware with shorthand and additional configuration.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware('http://localhost:3000/api', { changeOrigin: true });
// equals:
// const apiProxy = createProxyMiddleware('/api', {target:'http://localhost:3000', {changeOrigin:true}});
```

## Shorthand - WebSocket

This example will create a proxy middleware with shorthand and additional configuration for WebSocket support.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware('http://localhost:3000/api', { ws: true });
// equals:
// const apiProxy = createProxyMiddleware('/api', {target:'http://localhost:3000', ws: true});
```

## Shorthand - WebSocket only

This example will create a proxy middleware with websocket shorthand only configuration.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware('ws://localhost:3000/api');
// equals:
// const apiProxy = createProxyMiddleware('/api', {target:'ws://localhost:3000', ws: true});
```
