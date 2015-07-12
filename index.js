var httpProxy      = require('http-proxy');
var handlers       = require('./lib/handlers');
var contextMatcher = require('./lib/context-matcher');
var pathRewriter   = require('./lib/path-rewriter');

var httpProxyMiddleware = function (context, opts) {

    var proxyOptions = opts || {};

    // Legacy option.proxyHost
    // set options.headers.host when option.proxyHost is provided
    if (proxyOptions.proxyHost) {
        console.log('*************************************');
        console.log('[HPM] Deprecated "option.proxyHost"');
        console.log('      Use "option.changeOrigin" or "option.headers.host" instead');
        console.log('      "option.proxyHost" will be removed in future release.');
        console.log('*************************************');

        proxyOptions.headers = proxyOptions.headers || {};
        proxyOptions.headers.host = proxyOptions.proxyHost;
    }

    // create proxy
    var proxy = httpProxy.createProxyServer(proxyOptions);

    // handle option.pathRewrite
    if (proxyOptions.pathRewrite) {
        var rewriter = pathRewriter.create(proxyOptions.pathRewrite);

        proxy.on('proxyReq', function (proxyReq, req, res, options) {
            handlers.proxyPathRewrite(proxyReq, rewriter);
        });
    }

    // handle error and close connection properly
    proxy.on('error', function (err, req, res) {
        handlers.proxyError(err, req, res, proxyOptions);
    });

    console.log('[HPM] Proxy created:', context, ' -> ', proxyOptions.target);

    return middleware;

    function middleware (req, res, next) {
        if (contextMatcher.match(context, req.url)) {
           proxy.web(req, res);
        } else {
           next();
        }
    }

};

module.exports = httpProxyMiddleware;
