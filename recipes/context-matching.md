# Context matching

Determine which requests should be proxied.

Context matching is optional and is useful in cases where you are not able to use the regular [middleware mounting](http://expressjs.com/en/4x/api.html#app.use).

The [RFC 3986 `path`](https://tools.ietf.org/html/rfc3986#section-3.3) is used for context matching.

```
         foo://example.com:8042/over/there?name=ferret#nose
         \_/   \______________/\_________/ \_________/ \__/
          |           |            |            |        |
       scheme     authority       path        query   fragment
```


`http-proxy-middleware` offers several ways to do this:

<!-- MarkdownTOC autolink=true bracket=round -->

- [Path](#path)
- [Multi Path](#multi-path)
- [Wildcard](#wildcard)
- [Multi Wildcard](#multi-wildcard)
- [Wildcard / Exclusion](#wildcard--exclusion)
- [Custom filtering](#custom-filtering)

<!-- /MarkdownTOC -->


## Path

This will match paths starting with `/api`

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy('/api', {target: 'http://localhost:3000'});

// `/api/foo/bar` -> `http://localhost:3000/api/foo/bar`
```

## Multi Path

This will match paths starting with `/api` or `/rest`

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy(['/api', '/rest'], {target: 'http://localhost:3000'});

// `/api/foo/bar` -> `http://localhost:3000/api/foo/bar`
// `/rest/lorum/ipsum` -> `http://localhost:3000/rest/lorum/ipsum`
```

## Wildcard

This will match paths starting with `/api/` and should also end with `.json`

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy('/api/**/*.json', {target: 'http://localhost:3000'});
```

## Multi Wildcard

Multiple wildcards can be used.

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy(['/api/**/*.json', '/rest/**'], {target: 'http://localhost:3000'});
```

## Wildcard / Exclusion

This example will create a proxy with wildcard context matching.

```javascript
var proxy = require("http-proxy-middleware");

var apiProxy = proxy(['foo/*.js', '!bar.js'], {target: 'http://localhost:3000'});
```

## Custom filtering

Write your custom context matching function to have full control on the matching behavior.
The request `pathname` and `req` object are provided to determine which requests should be proxied or not.

```javascript
var proxy = require("http-proxy-middleware");

var filter = function (pathname, req) {
    return (pathname.match('^/api') && req.method === 'GET');
};

var apiProxy = proxy(filter, {target: 'http://localhost:3000'});
```
