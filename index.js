var httpProxy = require('http-proxy');
var utils     = require('./lib/utils');
var handlers  = require('./lib/handlers');

var httpProxyMiddleware = function (context, opts) {

    var proxyOptions = opts || {};

    // Legacy option.proxyHost
    // set options.headers.host when option.proxyHost is provided
    if (proxyOptions.proxyHost) {
        console.log('*************************************');
        console.log('[HPM] Deprecated "option.proxyHost"');
        console.log('      Use "option.headers.host" instead');
        console.log('      "option.proxyHost" will be removed in future release.');
        console.log('*************************************');

        proxyOptions.headers = proxyOptions.headers || {};
        proxyOptions.headers.host = proxyOptions.proxyHost;
    }

    var proxy = httpProxy.createProxyServer(proxyOptions);

    // modify requests
    // proxy.on('proxyReq', function () {});

    // handle error and close connection properly
    proxy.on('error', function (err, req, res) {
        handlers.proxyError(err, req, res, proxyOptions);
    });

    console.log('[HPM] Proxy created:', context, proxyOptions.target);

    return middleware;

    function middleware (req, res, next) {
        if (utils.hasContext(context, req.url)) {
           proxy.web(req, res);
        } else {
           next();
        }
    }

};

module.exports = httpProxyMiddleware;
