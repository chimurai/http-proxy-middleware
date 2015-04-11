var httpProxy = require('http-proxy');
var utils     = require('./lib/utils');
var handlers  = require('./lib/handlers');

var httpProxyMiddleware = function (context, opts) {

    var proxyOptions = opts || {};
    var proxy = httpProxy.createProxyServer(proxyOptions);

    console.log('[HPM] Proxy created:', context, proxyOptions.target);

    if (proxyOptions.proxyHost) {
        proxy.on('proxyReq', handlers.proxyReqHost);
    }

    proxy.on('error', function (err, req, res) {
        handlers.proxyError(err, req, res, proxyOptions);
    });

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
