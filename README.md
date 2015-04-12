# http-proxy-middleware
[![Build Status](https://img.shields.io/travis/chimurai/http-proxy-middleware/master.svg?style=flat-square)](https://travis-ci.org/chimurai/http-proxy-middleware)
[![Coveralls](https://img.shields.io/coveralls/chimurai/http-proxy-middleware.svg?style=flat-square)](https://coveralls.io/r/chimurai/http-proxy-middleware)
[![dependency Status](https://img.shields.io/david/chimurai/http-proxy-middleware.svg?style=flat-square)](https://david-dm.org/chimurai/http-proxy-middleware#info=devDependencies)
[![devDependency Status](https://img.shields.io/david/dev/chimurai/http-proxy-middleware.svg?style=flat-square)](https://david-dm.org/chimurai/http-proxy-middleware#info=devDependencies)
[![MIT license](https://img.shields.io/npm/l/http-proxy-middleware.svg?style=flat-square)](https://www.npmjs.com/package/http-proxy-middleware)

Middleware for [connect](https://github.com/senchalabs/connect) and [browser-sync](https://github.com/BrowserSync/browser-sync)

## Install
```javascript
npm install --save-dev http-proxy-middleware
```

## Core concept
Create and configure the proxy middleware so it can be used as middleware in connect or browser-sync.

```javascript
var proxyMiddleware = require('http-proxy-middleware');

var proxy = proxyMiddleware(context, options);
```

* `context` path to proxy. Example: '/api'
* `options.target` target host to proxy to. (See "[Options](#options)" for all options)

example
```javascript
// Requests to '/api/x/y/z' will be proxied to 'http://example.org/api/x/y/z'
var proxy = proxyMiddleware('/api', {target: 'http://www.example.org'});
```

Use this `proxy` object as middleware in any middleware compatible server, e.g., [connect](https://www.npmjs.com/package/connect), [express](https://www.npmjs.com/package/express), [browser-sync](https://www.npmjs.com/package/browser-sync)

## Options

 * **option.host**: string, proxy `host` header to target.
 Default host is set to the target's host.
 (useful for [name-based virtual hosted](http://en.wikipedia.org/wiki/Virtual_hosting#Name-based) sites)

The following options are provided by the underlying [http-proxy](https://www.npmjs.com/package/http-proxy).
 *  **option.target**: url string to be parsed with the url module
 *  **option.forward**: url string to be parsed with the url module
 *  **option.agent**: object to be passed to http(s).request (see Node's [https agent](http://nodejs.org/api/https.html#https_class_https_agent) and [http agent](http://nodejs.org/api/http.html#http_class_http_agent) objects)
 *  **option.secure**: true/false, if you want to verify the SSL Certs
 *  **option.xfwd**: true/false, adds x-forward headers
 *  **option.toProxy**: passes the absolute URL as the `path` (useful for proxying to proxies)
 *  **option.hostRewrite**: rewrites the location hostname on (301/302/307/308) redirects.

## Examples

  To view the examples, clone the http-proxy-middleware repo and install the dependencies:

```bash
$ git clone https://github.com/chimurai/http-proxy-middleware.git
$ cd http-proxy-middleware
$ npm install
```

  Then run whichever example you want:

```bash
$ node examples/connect
```

  Or just [explore the examples sources](https://github.com/chimurai/http-proxy-middleware/tree/master/examples)
 * [connect](https://github.com/chimurai/http-proxy-middleware/tree/master/examples/connect)
 * [express](https://github.com/chimurai/http-proxy-middleware/tree/master/examples/express)
 * [browser-sync](https://github.com/chimurai/http-proxy-middleware/tree/master/examples/browser-sync)

## Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm test
```

## Todo
 * context - add more flexibiliy to control when to proxy a request (multiple paths and glob patterns)
 * WebSocket support.
 * rewrite - ability to rewrite paths.
 * headers - ability to add headers to proxied requests.


## License:
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

