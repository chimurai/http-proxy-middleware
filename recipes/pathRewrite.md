# pathRewrite

Modify request paths before requests are send to the target.

<!-- MarkdownTOC autolink=true bracket=round -->

- [rewrite paths](#rewrite-paths)
- [remove paths](#remove-paths)
- [add paths](#add-paths)
- [custom rewrite function](#custom-rewrite-function)

<!-- /MarkdownTOC -->

## rewrite paths

Rewrite paths

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const options = {
  target: 'http://localhost:3000',
  pathRewrite: {
    '^/api/old-path': '/api/new-path', // rewrite path
  },
};

const apiProxy = createProxyMiddleware('/api', options);

// `/old/api/foo/bar` -> `http://localhost:3000/new/api/foo/bar`
```

## remove paths

Remove base path

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const options = {
  target: 'http://localhost:3000',
  pathRewrite: {
    '^/api/': '/', // remove base path
  },
};

const apiProxy = createProxyMiddleware('/api', options);

// `/api/lorum/ipsum` -> `http://localhost:3000/lorum/ipsum`
```

## add paths

Add base path

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const options = {
  target: 'http://localhost:3000',
  pathRewrite: {
    '^/': '/extra/', // add base path
  },
};

const apiProxy = createProxyMiddleware('/api', options);

// `/api/lorum/ipsum` -> `http://localhost:3000/extra/api/lorum/ipsum`
```

## custom rewrite function

Implement you own path rewrite logic.

The unmodified path will be used, when rewrite function returns `undefined`

```javascript
const { createProxyMiddleware } = require('http-proxy-middleware');

const rewriteFn = function (path, req) {
  return path.replace('/api/foo', '/api/bar');
};

const options = {
  target: 'http://localhost:3000',
  pathRewrite: rewriteFn,
};

const apiProxy = createProxyMiddleware('/api', options);

// `/api/foo/lorum/ipsum` -> `http://localhost:3000/api/bar/lorum/ipsum`
```
