# Basic usage

This example will create a basic proxy middleware.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  pathFilter: '/api',
  target: 'http://localhost:3000',
});
```

## Alternative configuration

The proxy behavior of the following examples are **exactly** the same; Just different ways to configure it.

```javascript
app.use(createProxyMiddleware('/api', { target: 'http://localhost:3000', changeOrigin: true }));
```

```javascript
app.use(createProxyMiddleware('http://localhost:3000/api', { changeOrigin: true }));
```

```javascript
app.use('/api', createProxyMiddleware('http://localhost:3000', { changeOrigin: true }));
```

```javascript
app.use('/api', createProxyMiddleware({ target: 'http://localhost:3000', changeOrigin: true }));
```
