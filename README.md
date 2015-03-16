# http-proxy-middleware
[![Build Status](https://img.shields.io/travis/chimurai/http-proxy-middleware/master.svg?style=flat-square)](https://travis-ci.org/chimurai/http-proxy-middleware)
[![dependency Status](https://img.shields.io/david/chimurai/http-proxy-middleware.svg?style=flat-square)](https://david-dm.org/chimurai/http-proxy-middleware#info=devDependencies)
[![devDependency Status](https://img.shields.io/david/dev/chimurai/http-proxy-middleware.svg?style=flat-square)](https://david-dm.org/chimurai/http-proxy-middleware#info=devDependencies)
[![NPM version](https://img.shields.io/npm/v/npm.svg?style=flat-square)](https://www.npmjs.com/package/http-proxy-middleware)
[![MIT license](https://img.shields.io/npm/l/http-proxy-middleware.svg?style=flat-square)](https://www.npmjs.com/package/http-proxy-middleware)

Middleware for [connect](https://github.com/senchalabs/connect) and [browser-sync](https://github.com/BrowserSync/browser-sync)

## Install
```javascript
npm install --save-dev http-proxy-middleware
```

## Usage

### core concept
Create and configure the proxy middleware so it can be used as middleware in connect or browser-sync.
```javascript
var proxyMiddleware = require('http-proxy-middleware');

var proxy = proxyMiddleware(context, options);
```
* `context` path to proxy. Example: '/api'
* `options.target` target host to proxy to. (See "Options" for all options)

### connect
Example: Proxy http://localhost:3000/ajax requests to http://cdnjs.cloudfare.com/ajax

```javascript
var http = require('http');
var connect  = require('connect');
var proxyMiddleware = require('http-proxy-middleware');

var context = '/ajax';
var proxy = proxyMiddleware(context, {target: 'http://cdnjs.cloudflare.com'});

var app = connect();
    app.use(context, proxy);

http.createServer(app).listen(3000);
```

### browser-sync
Example: Proxy http://localhost:3000/ajax requests to http://cdnjs.cloudfare.com/ajax

```javascript
var browserSync = require('browser-sync');
var proxyMiddleware = require('http-proxy-middleware');

var proxy = proxyMiddleware('/ajax', {target: 'http://cdnjs.cloudflare.com'});

browserSync({
    server: {
        baseDir: "./",
        port: 3000,
        middleware: [proxy]
    }
});
```

### gulp + browser-sync
Example: Proxy http://localhost:3000/ajax requests to http://cdnjs.cloudfare.com/ajax

```javascript
var gulp = require('gulp');
var browserSync = require('browser-sync');
var proxyMiddleware = require('http-proxy-middleware');

gulp.task('serve', function () {
    var proxy = proxyMiddleware('/ajax', {target: 'http://cdnjs.cloudflare.com'});

    browserSync({
        server: {
            baseDir: "./",
            port: 3000,
            middleware: [proxy]
        }
    });
});

gulp.task('default', ['serve']);
```

## Options

 * **option.proxyHost**: true/false, proxy `host` header to target. default:false. Useful for [Name-based virtual hosting](http://en.wikipedia.org/wiki/Virtual_hosting#Name-based)

### http-proxy options:
These options are provided by the underlying [http-proxy](https://www.npmjs.com/package/http-proxy).
 *  **target**: url string to be parsed with the url module
 *  **forward**: url string to be parsed with the url module
 *  **agent**: object to be passed to http(s).request (see Node's [https agent](http://nodejs.org/api/https.html#https_class_https_agent) and [http agent](http://nodejs.org/api/http.html#http_class_http_agent) objects)
 *  **secure**: true/false, if you want to verify the SSL Certs
 *  **xfwd**: true/false, adds x-forward headers
 *  **toProxy**: passes the absolute URL as the `path` (useful for proxying to proxies)
 *  **hostRewrite**: rewrites the location hostname on (301/302/307/308) redirects.

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

