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
var proxy = require("http-proxy-middleware");

var options = {
    target: 'http://localhost:3000',
    pathRewrite: {
        "^/old/api" : "/new/api"    // rewrite path
    }
};

var apiProxy = proxy('/api', options);

// `/old/api/foo/bar` -> `http://localhost:3000/new/api/foo/bar`
```

## remove paths

Remove base path

```javascript
var proxy = require("http-proxy-middleware");

var options = {
    target: 'http://localhost:3000',
    pathRewrite: {
        "^/remove/api" : ""          // remove base path
    }
};

var apiProxy = proxy('/api', options);

// `/remove/api/lorum/ipsum` -> `http://localhost:3000/lorum/ipsum`
```

## add paths

Add base path 

```javascript
var proxy = require("http-proxy-middleware");

var options = {
    target: 'http://localhost:3000',
    pathRewrite: {
        "^/" : "/extra/"          // add base path
    }
};

var apiProxy = proxy('/api', options);

// `/api/lorum/ipsum` -> `http://localhost:3000/extra/api/lorum/ipsum`
```

## custom rewrite function

Implement you own path rewrite logic.

The unmodified path will be used, when rewrite function returns `undefined`

```javascript
var proxy = require("http-proxy-middleware");

var rewriteFn = function (path, req) {
    return path.replace('/api/foo', '/api/bar');
}

var options = {
    target: 'http://localhost:3000',
    pathRewrite: rewriteFn
};

var apiProxy = proxy('/api', options);

// `/api/foo/lorum/ipsum` -> `http://localhost:3000/api/bar/lorum/ipsum`
```
