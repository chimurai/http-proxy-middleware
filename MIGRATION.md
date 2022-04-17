# Migration guide

- [v2 to v3 adapter](#v2-to-v3-adapter)
  - [`legacyCreateProxyMiddleware`](#legacycreateproxymiddleware)
- [v3 breaking changes](#v3-breaking-changes)
  - [Removed `req.url` patching](#removed-requrl-patching)
  - [Removed "shorthand" usage](#removed-shorthand-usage)
  - [Removed `context` argument](#removed-context-argument)
  - [Removed `logProvider` and `logLevel` options](#removed-logprovider-and-loglevel-options)
  - [Refactored proxy events](#refactored-proxy-events)

## v2 to v3 adapter

### `legacyCreateProxyMiddleware`

Use the adapter to use v3 without changing too much of your v2 code and configuration.

NOTE: `legacyCreateProxyMiddleware` will be removed in a future version.

```js
// before
const { createProxyMiddleware } = require('http-proxy-middleware');

createProxyMiddleware(...);

// after
const { legacyCreateProxyMiddleware } = require('http-proxy-middleware');

legacyCreateProxyMiddleware(...);
```

```ts
// before
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

createProxyMiddleware(...);

// after
import { legacyCreateProxyMiddleware, LegacyOptions } from 'http-proxy-middleware';

legacyCreateProxyMiddleware(...);
```

## v3 breaking changes

### Removed `req.url` patching

```js
// before
app.use('/user', proxy({ target: 'http://www.example.org' }));

// after
app.use('/user', proxy({ target: 'http://www.example.org/user' }));
```

### Removed "shorthand" usage

```js
// before
createProxyMiddleware('http:/www.example.org');

// after
createProxyMiddleware({ target: 'http:/www.example.org' });
```

### Removed `context` argument

See [recipes/pathFilter.md](./recipes/pathFilter.md) for more information.

```js
// before
createProxyMiddleware('/path', { target: 'http://www.example.org' });

// after
createProxyMiddleware({
  target: 'http://www.example.org',
  pathFilter: '/path',
});
```

### Removed `logProvider` and `logLevel` options

Use your external logging library to control the logging level.

Only `info`, `warn`, `error` are used internally for compatibility across different loggers.

If you use `winston`, make sure to enable interpolation: <https://github.com/winstonjs/winston#string-interpolation>

````js

See [recipes/logger.md](./recipes/logger.md) for more information.

```js
// new
createProxyMiddleware({
  target: 'http://www.example.org',
  logger: console,
});
````

### Refactored proxy events

See [recipes/proxy-events.md](./recipes/proxy-events.md) for more information.

```js
// before
createProxyMiddleware({
  target: 'http://www.example.org',
  onError: () => {},
  onProxyReq: () => {},
  onProxyRes: () => {},
  onProxyReqWs: () => {},
  onOpen: () => {},
  onClose: () => {},
});

// after
createProxyMiddleware({
  target: 'http://www.example.org',
  on: {
    error: () => {},
    proxyReq: () => {},
    proxyRes: () => {},
    proxyReqWs: () => {},
    open: () => {},
    close: () => {},
  },
});
```
