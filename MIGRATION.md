# Migration guide

- [v3 changes and discussions](#v3-changes-and-discussions)
- [v2 to v3 adapter](#v2-to-v3-adapter)
  - [`legacyCreateProxyMiddleware`](#legacycreateproxymiddleware)
- [v3 breaking changes](#v3-breaking-changes)
  - [Removed `req.url` patching](#removed-requrl-patching)
  - [`pathRewrite` (potential behavior change)](#pathrewrite-potential-behavior-change)
  - [Removed "shorthand" usage](#removed-shorthand-usage)
  - [Removed `context` argument](#removed-context-argument)
  - [Removed `logProvider` and `logLevel` options](#removed-logprovider-and-loglevel-options)
  - [Refactored proxy events](#refactored-proxy-events)

## v3 changes and discussions

See list of changes in V3:

<https://github.com/chimurai/http-proxy-middleware/discussions/768>

## v2 to v3 adapter

### `legacyCreateProxyMiddleware`

Use the adapter to use v3 with minimal changes to your v2 implementation.

💡 When you use `legacyCreateProxyMiddleware` it will print out console messages in run-time to guide you on how to migrate legacy configurations.

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

When proxy is mounted on a path, this path should be provided in the target.

```js
// before
app.use('/user', proxy({ target: 'http://www.example.org' }));

// after
app.use('/user', proxy({ target: 'http://www.example.org/user' }));
```

### `pathRewrite` (potential behavior change)

Related to removal of [`req.url` patching](#removed-requrl-patching).

`pathRewrite` now only rewrites the `path` after the mount point.

It was common to rewrite the `basePath` with the `pathRewrite` option:

```js
// before
app.use(
  '/user',
  proxy({
    target: 'http://www.example.org',
    pathRewrite: { '^/user': '/secret' },
  }),
);

// after
app.use('/user', proxy({ target: 'http://www.example.org/secret' }));
```

When proxy is mounted at the root, `pathRewrite` should still work as in v2.

```js
// not affected
app.use(
  proxy({
    target: 'http://www.example.org',
    pathRewrite: { '^/user': '/secret' },
  }),
);
```

### Removed "shorthand" usage

Specify the `target` option.

```js
// before
createProxyMiddleware('http:/www.example.org');

// after
createProxyMiddleware({ target: 'http:/www.example.org' });
```

### Removed `context` argument

The `context` argument has been moved to option: `pathFilter`.

Functionality did not change.

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

Use your external logging library to _log_ and control the logging _level_.

Only `info`, `warn`, `error` are used internally for compatibility across different loggers.

If you use `winston`, make sure to enable interpolation: <https://github.com/winstonjs/winston#string-interpolation>

See [recipes/logger.md](./recipes/logger.md) for more information.

```js
// new
createProxyMiddleware({
  target: 'http://www.example.org',
  logger: console,
});
```

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
