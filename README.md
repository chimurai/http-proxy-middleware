# http-proxy-middleware
[![Build Status](https://img.shields.io/travis/chimurai/http-proxy-middleware/master.svg?style=flat-square)](https://travis-ci.org/chimurai/http-proxy-middleware)
[![Coveralls](https://img.shields.io/coveralls/chimurai/http-proxy-middleware.svg?style=flat-square)](https://coveralls.io/r/chimurai/http-proxy-middleware)
[![dependency Status](https://img.shields.io/david/chimurai/http-proxy-middleware.svg?style=flat-square)](https://david-dm.org/chimurai/http-proxy-middleware#info=devDependencies)
[![devDependency Status](https://img.shields.io/david/dev/chimurai/http-proxy-middleware.svg?style=flat-square)](https://david-dm.org/chimurai/http-proxy-middleware#info=devDependencies)
[![MIT license](https://img.shields.io/npm/l/http-proxy-middleware.svg?style=flat-square)](https://www.npmjs.com/package/http-proxy-middleware)

The one-liner proxy middleware for [connect](https://github.com/senchalabs/connect), [express](https://github.com/strongloop/express) and [browser-sync](https://github.com/BrowserSync/browser-sync)

## Install
```javascript
npm install --save-dev http-proxy-middleware
```

## Core concept
Create and configure the proxy middleware.
```javascript
var proxy = proxyMiddleware('/api', {target: 'http://www.example.org'});
//  'proxy' is now ready to be used is a server.

```

## Example
```javascript
// dependencies
var express = require('express');
var proxyMiddleware = require('http-proxy-middleware');

// configure proxy middleware
var context = '/api';                     // requests with this path will be proxied
var options = {
        target: 'http://www.example.org', // target
        changeOrigin: true                // needed for virtual hosted sites
    };

// create the proxy
var proxy = proxyMiddleware(context, options);

// use the configured `proxy` in web server
var app = express();
    app.use(proxy);
    app.listen(3000);
```

* `context` path to proxy. Example: '/api'
* `options.target` target host to proxy to. (See "[Options](#options)" for all options)

**Tip:** For [name-based virtual hosted sites](http://en.wikipedia.org/wiki/Virtual_hosting#Name-based), you'll need to use the option `changeOrigin` and set it to `true`.

## Compatible servers:
http-proxy-middleware is compatible with the following servers:
* [connect](https://www.npmjs.com/package/connect)
* [express](https://www.npmjs.com/package/express)
* [browser-sync](https://www.npmjs.com/package/browser-sync)


## Options

* (DEPRECATED) **option.proxyHost**: Use `option.changeOrigin = true` instead.
*  **option.pathRewrite**: object, rewrite the url path. Object-keys will be used as _RegEx_ to match paths.

    ```javascript
    {
        "^/old/api" : "/new/api",    // rewrite path
        "^/remove/api" : ""          // remove path
    }
    ```

The following options are provided by the underlying [http-proxy](https://www.npmjs.com/package/http-proxy).
 *  **option.target**: url string to be parsed with the url module
 *  **option.forward**: url string to be parsed with the url module
 *  **option.agent**: object to be passed to http(s).request (see Node's [https agent](http://nodejs.org/api/https.html#https_class_https_agent) and [http agent](http://nodejs.org/api/http.html#http_class_http_agent) objects)
 *  **option.secure**: true/false, if you want to verify the SSL Certs
 *  **option.xfwd**: true/false, adds x-forward headers
 *  **option.toProxy**: passes the absolute URL as the `path` (useful for proxying to proxies)
 *  **option.hostRewrite**: rewrites the location hostname on (301/302/307/308) redirects.

Undocumented options are provided by the underlying [http-proxy](https://www.npmjs.com/package/http-proxy).
https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy.js#L32
 *  **option.headers**: object, adds [request headers](https://en.wikipedia.org/wiki/List_of_HTTP_header_fields#Request_fields). (Example: `{host:'www.example.org'}`
 *  **option.changeOrigin**: true/false, adds host to request header.
 *  **option.prependPath**: true/false, Default: true - specify whether you want to prepend the target's path to the proxy path>
 *  **option.ignorePath**: true/false, Default: false - specify whether you want to ignore the proxy path of the incoming request>
 *  **option.localAddress** : Local interface string to bind for outgoing connections
 *  **option.auth** : Basic authentication i.e. 'user:password' to compute an Authorization header.
 *  **option.autoRewrite**: rewrites the location host/port on (301/302/307/308) redirects based on requested host/port. Default: false.
 *  **option.protocolRewrite**: rewrites the location protocol on (301/302/307/308) redirects to 'http' or 'https'. Default: null.



## More Examples

  To [view the examples](https://github.com/chimurai/http-proxy-middleware/tree/master/examples), clone the http-proxy-middleware repo and install the dependencies:

```bash
$ git clone https://github.com/chimurai/http-proxy-middleware.git
$ cd http-proxy-middleware
$ npm install
```

  Then run whichever example you want:

```bash
$ node examples/connect
```

  Or just [explore the examples sources](https://github.com/chimurai/http-proxy-middleware/tree/master/examples):
 * `examples/connect` - Example usage with [connect](https://github.com/chimurai/http-proxy-middleware/tree/master/examples/connect)
 * `examples/express` - Example usage with [express](https://github.com/chimurai/http-proxy-middleware/tree/master/examples/express)
 * `examples/browser-sync` - Example usage with [browser-sync](https://github.com/chimurai/http-proxy-middleware/tree/master/examples/browser-sync)

## Tests

  To run the test suite, first install the dependencies, then run `npm test`:

```bash
$ npm test
```


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

