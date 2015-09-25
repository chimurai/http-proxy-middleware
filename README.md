# http-proxy-middleware

[![Build Status](https://img.shields.io/travis/chimurai/http-proxy-middleware/master.svg?style=flat-square)](https://travis-ci.org/chimurai/http-proxy-middleware)
[![Coveralls](https://img.shields.io/coveralls/chimurai/http-proxy-middleware.svg?style=flat-square)](https://coveralls.io/r/chimurai/http-proxy-middleware)
[![Codacy](https://img.shields.io/codacy/43dc1adc5e4b490ca84a1f447c13795a.svg?style=flat-square)](https://www.codacy.com/app/chimurai/http-proxy-middleware/dashboard)
[![dependency Status](https://img.shields.io/david/chimurai/http-proxy-middleware.svg?style=flat-square)](https://david-dm.org/chimurai/http-proxy-middleware#info=dependencies)
[![devDependency Status](https://img.shields.io/david/dev/chimurai/http-proxy-middleware.svg?style=flat-square)](https://david-dm.org/chimurai/http-proxy-middleware#info=devDependencies)

The one-liner node.js proxy middleware for [connect](https://github.com/senchalabs/connect), [express](https://github.com/strongloop/express) and [browser-sync](https://github.com/BrowserSync/browser-sync)

## Install

```javascript
$ npm install --save-dev http-proxy-middleware
```

## Core concept

Configure the proxy middleware.
```javascript
var proxyMiddleware = require('http-proxy-middleware');

var proxy = proxyMiddleware('/api', {target: 'http://www.example.org'});
//                          \____/  \________________________________/
//                            |                     |
//                          context              options

// 'proxy' is now ready to be used in a server.
```
* **context**: matches provided context against request-urls' path.
    Matching requests will be proxied to the target host.
    Example: `'/api'` or `['/api', '/ajax']`. (more about [context matching](#context-matching))
* **options.target**: target host to proxy to.
    Check out available [proxy middleware options](#options).

``` javascript
// shorthand syntax for the example above:
var proxy = proxyMiddleware('http://www.example.org/api');

```
More about the [shorthand configuration](#shorthand).

## Example

An example with express server.
```javascript
// include dependencies
var express = require('express');
var proxyMiddleware = require('http-proxy-middleware');

// configure proxy middleware context
var context = '/api';                     // requests with this path will be proxied

// configure proxy middleware options
var options = {
        target: 'http://www.example.org', // target host
        changeOrigin: true,               // needed for virtual hosted sites
        ws: true,                         // proxy websockets
        pathRewrite: {
            '^/old/api' : '/new/api'      // rewrite paths
        },
        proxyTable: {
            // when request.headers.host == 'dev.localhost:3000',
            // override target 'http://www.example.org' to 'http://localhost:8000'
            'dev.localhost:3000' : 'http://localhost:8000'
        }
    };

// create the proxy
var proxy = proxyMiddleware(context, options);

// use the configured `proxy` in web server
var app = express();
    app.use(proxy);
    app.listen(3000);
```

Check out [working  examples](#more-examples).

**Tip:** For [name-based virtual hosted sites](http://en.wikipedia.org/wiki/Virtual_hosting#Name-based), you'll need to use the option `changeOrigin` and set it to `true`.

## Context matching

http-proxy-middleware offers several ways to decide which requests should be proxied.
Request URL's [ _path-absolute_ and _query_](https://tools.ietf.org/html/rfc3986#section-3) will be used for context matching .

* **path matching**
    - `'/'` - matches any path, all requests will be proxied.
    - `'/api'` - matches paths starting with `/api`

* **multiple path matching**
    - `['/api', '/ajax', '/someotherpath']`

* **wildcard path matching**
    For fine-grained control you can use wildcard matching. Glob pattern matching is done by _micromatch_. Visit [micromatch](https://www.npmjs.com/package/micromatch) or [glob](https://www.npmjs.com/package/glob) for more globbing examples.
    - `'**'` matches any path, all requests will be proxied.
    - `'**/*.html'` matches any path which ends with `.html`
    - `'/*.html'` matches paths directly under path-absolute
    - `'/api/**/*.html'` matches requests ending with `.html` in the path of `/api`
    - `['/api/**', '/ajax/**']` combine multiple patterns
    - `['/api/**', '!**/bad.json']` exclusion

## Shorthand

Use the shorthand syntax when verbose configuration is not needed. The `context` and `option.target` will be automatically configured when shorthand is used. Options can still be used if needed.

```javascript
proxyMiddleware('http://www.example.org:8000/api');
// proxyMiddleware('/api', {target: 'http://www.example.org:8000'});


proxyMiddleware('http://www.example.org:8000/api/books/*/**.json');
// proxyMiddleware('/api/books/*/**.json', {target: 'http://www.example.org:8000'});


proxyMiddleware('http://www.example.org:8000/api', {changeOrigin:true});
// proxyMiddleware('/api', {target: 'http://www.example.org:8000', changeOrigin: true});
```

## WebSocket

```javascript
// verbose api
proxyMiddleware('/', {target:'http://echo.websocket.org', ws: true});

// shorthand
proxyMiddleware('http://echo.websocket.org', {ws:true});

// shorter shorthand
proxyMiddleware('ws://echo.websocket.org');
```

### External WebSocket upgrade

In the previous WebSocket examples, http-proxy-middleware relies on a initial http request in order to listen to the http `upgrade` event. If you need to proxy WebSockets without the initial http request, you can subscribe to the server's http `upgrade` event manually.
```javascript
var proxy = proxyMiddleware('ws://echo.websocket.org', {changeOrigin:true});

var app = express();
    app.use(proxy);

var server = app.listen(3000);
    server.on('upgrade', proxy.upgrade);    // <-- subscribe to http 'upgrade'
```

## Options

*  **option.pathRewrite**: object, rewrite target's url path. Object-keys will be used as _RegExp_ to match paths.
    ```javascript
    {
        "^/old/api" : "/new/api",    // rewrite path
        "^/remove/api" : ""          // remove path
    }
    ```

* **option.proxyTable**: object, re-target `option.target` based on the request header `host` parameter. `host` can be used in conjunction with `path`. Only one instance of the proxy will be used. The order of the configuration matters.
    ```javascript
    {
        "integration.localhost:3000" : "http://localhost:8001",    // host only
        "staging.localhost:3000"     : "http://localhost:8002",    // host only
        "localhost:3000/api"         : "http://localhost:8003",    // host + path
        "/rest"                      : "http://localhost:8004"     // path only
    }
    ```

*  **option.onError**: function, subscribe to http-proxy's error event for custom error handling.
    ```javascript
    function onError(err, req, res) {
        res.writeHead(500, {
            'Content-Type': 'text/plain'
        });
        res.end('Something went wrong. And we are reporting a custom error message.');
    }
    ```

*  **option.onProxyRes**: function, subscribe to http-proxy's proxyRes event.
    ```javascript
    function onProxyRes(proxyRes, req, res) {
        proxyRes.headers['x-added'] = 'foobar';     // add new header to response
        delete proxyRes.headers['x-removed'];       // remove header from response
    }
    ```
*  **option.debugLog**: boolean, log to console when proxy-related events happen.

* (DEPRECATED) **option.proxyHost**: Use `option.changeOrigin = true` instead.

The following options are provided by the underlying [http-proxy](https://www.npmjs.com/package/http-proxy).

*  **option.target**: url string to be parsed with the url module
*  **option.forward**: url string to be parsed with the url module
*  **option.agent**: object to be passed to http(s).request (see Node's [https agent](http://nodejs.org/api/https.html#https_class_https_agent) and [http agent](http://nodejs.org/api/http.html#http_class_http_agent) objects)
*  **option.ssl**: object to be passed to https.createServer()
*  **option.ws**: true/false: if you want to proxy websockets
*  **option.xfwd**: true/false, adds x-forward headers
*  **option.secure**: true/false, if you want to verify the SSL Certs
*  **option.toProxy**: passes the absolute URL as the `path` (useful for proxying to proxies)
*  **option.prependPath**: true/false, Default: true - specify whether you want to prepend the target's path to the proxy path>
*  **option.ignorePath**: true/false, Default: false - specify whether you want to ignore the proxy path of the incoming request>
*  **option.localAddress** : Local interface string to bind for outgoing connections
*  **option.changeOrigin**: true/false, adds host to request header.
*  **option.auth** : Basic authentication i.e. 'user:password' to compute an Authorization header.
*  **option.hostRewrite**: rewrites the location hostname on (301/302/307/308) redirects.
*  **option.autoRewrite**: rewrites the location host/port on (301/302/307/308) redirects based on requested host/port. Default: false.
*  **option.protocolRewrite**: rewrites the location protocol on (301/302/307/308) redirects to 'http' or 'https'. Default: null.

Undocumented options are provided by the underlying http-proxy
*  **option.headers**: object, adds [request headers](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Request_fields). (Example: `{host:'www.example.org'}`) [source](https://github.com/nodejitsu/node-http-proxy/blob/master/examples/http/proxy-http-to-https.js#L41)

## More Examples

  To run and view the [proxy examples](https://github.com/chimurai/http-proxy-middleware/tree/master/examples), clone the http-proxy-middleware repo and install the dependencies:

```bash
$ git clone https://github.com/chimurai/http-proxy-middleware.git
$ cd http-proxy-middleware
$ npm install
```

  Then run whichever example you want:

```bash
$ node examples/connect
```

  Or just explore the proxy examples' sources:
    * `examples/connect` - [connect proxy example](https://github.com/chimurai/http-proxy-middleware/tree/master/examples/connect/index.js)
    * `examples/express` - [express proxy example](https://github.com/chimurai/http-proxy-middleware/tree/master/examples/express/index.js)
    * `examples/browser-sync` - [browser-sync proxy example](https://github.com/chimurai/http-proxy-middleware/tree/master/examples/browser-sync/index.js)
    * `examples/websocket` - [websocket proxy example](https://github.com/chimurai/http-proxy-middleware/tree/master/examples/websocket/index.js) with express

## Compatible servers

http-proxy-middleware is compatible with the following servers:
* [connect](https://www.npmjs.com/package/connect)
* [express](https://www.npmjs.com/package/express)
* [browser-sync](https://www.npmjs.com/package/browser-sync)

## Tests

  To run the test suite, first install the dependencies, then run:

```bash
# unit tests
$ npm test

# code coverage
$ npm run cover
```

## Changelog

* [v0.8.1](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.8.1) - fixed pathRewrite when `agent` is configured
* [v0.8.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.8.0) - support external websocket upgrade, fixed websocket shorthand
* [v0.7.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.7.0) - support shorthand syntax, fixed express/connect mounting
* [v0.6.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.6.0) - support proxyTable
* [v0.5.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.5.0) - support subscribing to http-proxy error- and proxyRes-event
* [v0.4.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.4.0) - support websocket
* [v0.3.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.3.0) - support wildcard / glob
* [v0.2.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.2.0) - support multiple paths
* [v0.1.0](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.1.0) - support path rewrite. deprecate proxyHost option
* [v0.0.5](https://github.com/chimurai/http-proxy-middleware/releases/tag/v0.0.5) - initial release

## License

The MIT License (MIT)

Copyright (c) 2015 Steven Chim

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

