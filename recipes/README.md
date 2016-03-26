# Recipes

Common usages of `http-proxy-middleware`.

# Configuration example

Overview of `http-proxy-middleware` specific options.

http-proxy-middleware uses Nodejitsu's [http-proxy](https://github.com/nodejitsu/node-http-proxy) to do the actual proxying. All of its [options](https://github.com/nodejitsu/node-http-proxy#options) are exposed via http-proxy-middleware's configuration object.


```javascript
var proxy = require("http-proxy-middleware");
var winston = require('winston');

/**
 * Context matching: decide which path(s) should be proxied. (wildcards supported)
 **/
var context = '/api';

/**
 * Proxy options
 */
var options = {
    // hostname to the target server
    target: 'http://localhost:3000',

    // set correct host headers for name-based virtual hosted sites
    changeOrigin: true,

    // enable websocket proxying
    ws: true,

    // additional request headers
    headers: {
        'x-powered-by': 'foobar'
    },

    // rewrite paths
    pathRewrite: {
        '^/old/api': '/new/api',    // rewrite path
        '^/remove/api': ''          // remove path
    },

    // re-target based on the request's host header and/or path
    proxyTable: {
      // host[/path]                 :  <new target>
      // /path                       :  <new target>
        'integration.localhost:8000' : 'http://localhost:8001',  // host only
        'staging.localhost:8000'     : 'http://localhost:8002',  // host only
        'localhost:8000/api'         : 'http://localhost:8003',  // host + path
        '/rest'                      : 'http://localhost:8004'   // path only
    },

    // control logging
    logLevel: 'silent',

    // use a different lib for logging;
    // i.e., write logs to file or server
    logProvider: function (provider) {
        return winston;
    },

    // subscribe to http-proxy's error event
    onError: function onError(err, req, res) {
        res.writeHead(500, {'Content-Type': 'text/plain'});
        res.end('Something went wrong.');
    },

    // subscribe to http-proxy's proxyRes event
    onProxyRes: function (proxyRes, req, res) {
        proxyRes.headers['x-added'] = 'foobar';
        delete proxyRes.headers['x-removed'];
    },

    // subscribe to http-proxy's proxyReq event
    onProxyReq: function (proxyReq, req, res) {
        // add custom header to request
        proxyReq.setHeader('x-powered-by', 'foobar');
    }

    /**
     * The following options are provided by Nodejitsu's http-proxy
     */

    // target
    // forward
    // agent
    // ssl
    // ws
    // xfwd
    // secure
    // toProxy
    // prependPath
    // ignorePath
    // localAddress
    // changeOrigin
    // auth
    // hostRewrite
    // autoRewrite
    // protocolRewrite
    // headers

};

/**
 * Create the proxy middleware, so it can be used in a server.
 */
var apiProxy = proxy(context, options);
```
