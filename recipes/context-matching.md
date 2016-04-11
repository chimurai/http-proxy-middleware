# Context matching

Determine which requests should be proxied. `http-proxy-middleware` offers several ways to do this:

<!-- MarkdownTOC autolink=true bracket=round -->

- [Path](#path)
- [Multi Path](#multi-path)
- [Wildcard](#wildcard)
- [Multi Wildcard](#multi-wildcard)
- [Wildcard / Exclusion](#wildcard--exclusion)
- [Custom filtering](#custom-filtering)

<!-- /MarkdownTOC -->


## Path

This example will create a basic proxy.

Requests with path `/api` will be proxied to `http://localhost:3000`

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy('/api', {target: 'http://localhost:3000'});

// `/api/foo/bar` -> `http://localhost:3000/api/foo/bar`
```

## Multi Path

This example will create a basic proxy 

Requests with path `/api` and `/rest` will be proxied to `http://localhost:3000`

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy(['/api', '/rest'], {target: 'http://localhost:3000'});

// `/api/foo/bar` -> `http://localhost:3000/api/foo/bar`
// `/rest/lorum/ipsum` -> `http://localhost:3000/rest/lorum/ipsum`
```

## Wildcard

This example will create a proxy with wildcard context matching.

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy('/api/**/*.json', {target: 'http://localhost:3000'});
```

## Multi Wildcard

This example will create a proxy with wildcard context matching.

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy(['/api/**', '/ajax/**'], {target: 'http://localhost:3000'});
```

## Wildcard / Exclusion

This example will create a proxy with wildcard context matching.

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy(['/api/**', '!**/bad.json'], {target: 'http://localhost:3000'});
```

## Custom filtering

This example will create a proxy with custom filtering.
The request `path` and `req` object are provided to determine which requests should be proxied or not.

```javascript
var proxy = require("http-proxy-middleware");

var filter = function (path, req) {
    return (path.match('^/api') && req.method === 'GET');
};

var apiProxy = proxy(filter, {target: 'http://localhost:3000'});
```
