var httpProxy = require('http-proxy');
var utils     = require('./lib/utils');
var handlers  = require('./lib/handlers');

var httpProxyMiddleware = function (context, opts) {

    var proxyOptions = opts || {};
    var proxy = httpProxy.createProxyServer(proxyOptions);

    if (proxyOptions.proxyHost) {
        console.log('*************************************');
        console.log('[HPM] Depecrecated "option.proxyHost"');
        console.log('      Use option.host instead');
        console.log('*************************************');
    }

    // modify requests
    proxy.on('proxyReq', handlers.proxyReqHost);

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
