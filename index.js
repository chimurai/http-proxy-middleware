var httpProxy      = require('http-proxy');
var handlers       = require('./lib/handlers');
var contextMatcher = require('./lib/context-matcher');
var PathRewriter   = require('./lib/path-rewriter');
var ProxyTable     = require('./lib/proxy-table');

var httpProxyMiddleware = function (context, opts) {
    var isWsUpgradeListened = false;
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
    console.log('[HPM] Proxy created:', context, ' -> ', proxyOptions.target);

    var pathRewriter = PathRewriter.create(proxyOptions.pathRewrite); // returns undefined when "pathRewrite" is not provided

    // handle option.pathRewrite
    if (pathRewriter) {
        var proxyReqPathRewrite = function (proxyReq, req, res, options) {
            proxyReq.path = pathRewriter(proxyReq.path);
        };
        proxy.on('proxyReq', proxyReqPathRewrite);
    }

    // Custom listener for the `proxyRes` event on `proxy`.
    if (isFunction(proxyOptions.onProxyRes)) {
        proxy.on('proxyRes', proxyOptions.onProxyRes);
    }

    // Custom listener for the `error` event on `proxy`.
    var onProxyError = getProxyErrorHandler();
    // handle error and close connection properly
    proxy.on('error', onProxyError);
    proxy.on('error', proxyErrorLogger);

    // Listen for the `close` event on `proxy`.
    proxy.on('close', function (req, socket, head) {
        // view disconnected websocket connections
        console.log('[HPM] Client disconnected');
    });

    return middleware;

    function middleware (req, res, next) {
        if (contextMatcher.match(context, req.url)) {
            if (proxyOptions.proxyTable) {
                // change option.target when proxyTable present.
                proxy.web(req, res, ProxyTable.createProxyOptions(req, proxyOptions));
            } else {
                proxy.web(req, res);
            }

        } else {
            next();
        }

        if (proxyOptions.ws === true) {
            catchUpgradeRequest(req);
        }
    }

    function catchUpgradeRequest (req) {
        // make sure only 1 handle listens to server's upgrade request.
        if (isWsUpgradeListened === true) {
            return;
        }

        isWsUpgradeListened = true;

        req.connection.server.on('upgrade', function (req, socket, head) {
            if (contextMatcher.match(context, req.url)) {
                if (pathRewriter) {
                    req.url = pathRewriter(req.url);
                }
                proxy.ws(req, socket, head);
                console.log('[HPM] Upgrading to WebSocket');
            }
        });
    }

    function getProxyErrorHandler () {
        if (isFunction(proxyOptions.onError)) {
            return proxyOptions.onError;   // custom error listener
        }

        return handlers.proxyError;       // otherwise fall back to default
    }

    function proxyErrorLogger (err, req, res) {
        var targetUri = proxyOptions.target.host + req.url;
        console.log('[HPM] Proxy error:', err.code, targetUri);
    }

    function isFunction (v) {
        return (v && typeof v === 'function');
    }

};

module.exports = httpProxyMiddleware;
