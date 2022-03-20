# Path Filter

Narrow down which requests should be proxied. The `path` used for filtering is the `request.url` pathname. In Express, this is the `path` relative to the mount-point of the proxy.

`pathFilter` is optional and is useful in cases where you are not able to use the regular [middleware mounting](http://expressjs.com/en/4x/api.html#app.use).

`http-proxy-middleware` offers several ways to do this:

- [Path](#path)
- [Multi Path](#multi-path)
- [Wildcard](#wildcard)
- [Multi Wildcard](#multi-wildcard)
- [Wildcard / Exclusion](#wildcard--exclusion)
- [Custom filtering](#custom-filtering)

## Path

This will match paths starting with `/api`

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  pathFilter: '/api',
});

// `/api/foo/bar` -> `http://localhost:3000/api/foo/bar`
```

## Multi Path

This will match paths starting with `/api` or `/rest`

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  pathFilter: ['/api', '/rest'],
});

// `/api/foo/bar` -> `http://localhost:3000/api/foo/bar`
// `/rest/lorum/ipsum` -> `http://localhost:3000/rest/lorum/ipsum`
```

## Wildcard

This will match paths starting with `/api/` and should also end with `.json`

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  pathFilter: '/api/**/*.json',
});
```

## Multi Wildcard

Multiple wildcards can be used.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  pathFilter: ['/api/**/*.json', '/rest/**'],
});
```

## Wildcard / Exclusion

This example will create a proxy with globs.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const apiProxy = createProxyMiddleware({
  target: 'http://localhost:3000',
  pathFilter: ['foo/*.js', '!bar.js'],
});
```

## Custom filtering

Write your custom `pathFilter` function to have full control on the matching behavior.
The request `pathname` and `req` object are provided to determine which requests should be proxied or not.

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const pathFilter = function (pathname, req) {
  return pathname.match('^/api') && req.method === 'GET';
};

const apiProxy = createProxyMiddleware({
  pathFilter: pathFilter,
  target: 'http://localhost:3000',
});
```
