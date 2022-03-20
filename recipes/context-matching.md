# [BREAKING CHANGE]

This functionality is removed in v3.

The old "context matching" function has been moved to the [pathFilter](pathFilter.md) configuration property.

TL;DR

```js
// v2
createProxyMiddleware('/api', {
  target: 'http://localhost:3000',
});

// v3
createProxyMiddleware({
  target: 'http://localhost:3000',
  pathFilter: '/api',
});
```
