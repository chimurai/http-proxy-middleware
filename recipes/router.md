# router

Allows you to route to a different `target` by using a table of a custom function.

<!-- MarkdownTOC autolink=true bracket=round -->

- [Custom router function](#custom-router-function)
- [Proxy Table](#proxy-table)

<!-- /MarkdownTOC -->


## Custom router function

Write your own router to dynamically route to a different `target`.
The `req` object is provided to retrieve contextual data.

```javascript
var express = require('express');
var proxy = require("http-proxy-middleware");

var customRouter = function(req) {
    return 'http://www.example.org'    // protocol + host
};

var options = {
    target: 'http://localhost:8000',
    router: customRouter
};

var myProxy = proxy(options);

var app = express();
app.use(myProxy);                      // add the proxy to express

app.listen(3000);
```


## Proxy Table

Use a Proxy Table to proxy requests to a different `target` based on:
* Host [HTTP header](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Request_fields).
* Request path
* Host HTTP header + path

```javascript
var express = require('express');
var proxy = require("http-proxy-middleware");

var proxyTable = {
    "integration.localhost:3000" : "http://localhost:8001",    // host only
    "staging.localhost:3000"     : "http://localhost:8002",    // host only
    "localhost:3000/api"         : "http://localhost:8003",    // host + path
    "/rest"                      : "http://localhost:8004"     // path only
};

var options = {
    target: 'http://localhost:8000',
    router: proxyTable
};

var myProxy = proxy(options);

var app = express();
app.use(myProxy);                      // add the proxy to express

app.listen(3000);
```

### Example

In the example above; all requests will be proxied to `http://localhost:8000`.

When request's `Host HTTP header` and/or `path` match a configuration in the proxyTable, they will be send to matching target.

```
http://localhost:3000/lorum/ipsum             -> http://localhost:8000/lorum/ipsum
http://integration.localhost:3000/lorum/ipsum -> http://localhost:8001/lorum/ipsum
http://staging.localhost:3000/rest/foo/bar    -> http://localhost:8002/rest/foo/bar
http://localhost:3000/api/houses/123          -> http://localhost:8003/api/houses/123
http://localhost:3000/rest/books/123          -> http://localhost:8004/rest/books/123
```
