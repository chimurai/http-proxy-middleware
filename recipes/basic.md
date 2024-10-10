# Basic usage

This example will create a basic proxy middleware.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
});
```

## Alternative configuration

```javascript
app.use('/api', createProxyMiddleware({ target: 'http://localhost:3000/api', changeOrigin: true }));
```

```javascript
app.use(
  createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    pathFilter: '/api',
  }),
);
```
