# Log Level

Control the amount of logging of http-proxy-middleware.

Possible values:

- `debug`
- `info`
- `warn` (default)
- `error`
- `silent`

## Level: debug

Log everything.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const options = {
  target: 'http://localhost:3000',
  logLevel: 'debug',
};

const apiProxy = createProxyMiddleware('/api', options);
```

## Level: silent

Suppress all logging.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const options = {
  target: 'http://localhost:3000',
  logLevel: 'silent',
};

const apiProxy = createProxyMiddleware('/api', options);
```
