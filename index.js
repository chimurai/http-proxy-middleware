var _              = require('lodash');
var httpProxy      = require('http-proxy');
var configFactory  = require('./lib/config-factory');
var handlers       = require('./lib/handlers');
var contextMatcher = require('./lib/context-matcher');
var PathRewriter   = require('./lib/path-rewriter');
var ProxyTable     = require('./lib/proxy-table');
var logger         = require('./lib/logger').getInstance();

var httpProxyMiddleware = function (context, opts) {
    var isWsUpgradeListened = false;
    var config              = configFactory.createConfig(context, opts);
    var proxyOptions        = config.options;

    // create proxy
    var proxy = httpProxy.createProxyServer(proxyOptions);
    logger.info('[HPM] Proxy created:', config.context, ' -> ', proxyOptions.target);

    var pathRewriter = PathRewriter.create(proxyOptions.pathRewrite); // returns undefined when "pathRewrite" is not provided

    // Custom listener for the `proxyRes` event on `proxy`.
    if (_.isFunction(proxyOptions.onProxyRes)) {
        proxy.on('proxyRes', proxyOptions.onProxyRes);
    }

    // Custom listener for the `proxyReq` event on `proxy`.
    if (_.isFunction(proxyOptions.onProxyReq)) {
        proxy.on('proxyReq', proxyOptions.onProxyReq);
    }

    // Custom listener for the `error` event on `proxy`.
    var onProxyError = getProxyErrorHandler();
    // handle error and close connection properly
    proxy.on('error', onProxyError);
    proxy.on('error', proxyErrorLogger);

    // Listen for the `close` event on `proxy`.
    proxy.on('close', function (req, socket, head) {
        // view disconnected websocket connections
        logger.info('[HPM] Client disconnected');
    });

    // https://github.com/chimurai/http-proxy-middleware/issues/19
    // expose function to upgrade externally
    middleware.upgrade = function (req, socket, head) {
        handleUpgrade(req, socket, head);
        isWsUpgradeListened = true;
    };

    return middleware;

    function middleware (req, res, next) {
        // https://github.com/chimurai/http-proxy-middleware/issues/17
        if (req.baseUrl) {
            req.url = req.originalUrl;
        }

        if (contextMatcher.match(config.context, req.url)) {
            logger.debug('[HPM] Context match: "%s" -> "%s"', config.context, req.url);

            // handle option.pathRewrite
            if (pathRewriter) {
                req.url = pathRewriter(req.url);
            }
            if (proxyOptions.proxyTable) {
                // change option.target when proxyTable present.
                var altOpts = ProxyTable.createProxyOptions(req, proxyOptions);
                logger.debug('[HPM] Proxying "%s": "%s" -> "%s"', req.url, req.hostname, altOpts.target);
                proxy.web(req, res, altOpts);
            } else {
                logger.debug('[HPM] Proxying "%s": "%s" -> "%s"', req.url, req.hostname, proxyOptions.target);
                proxy.web(req, res);
            }

        } else {
            next();
        }

        if (proxyOptions.ws === true) {
            catchUpgradeRequest(req.connection.server);
        }
    }

    function catchUpgradeRequest (server) {
        // make sure only 1 handle listens to server's upgrade request.
        if (isWsUpgradeListened === true) {
            return;
        }

        server.on('upgrade', handleUpgrade);
        isWsUpgradeListened = true;
    }

    function handleUpgrade (req, socket, head) {
        if (contextMatcher.match(config.context, req.url)) {
            if (pathRewriter) {
                req.url = pathRewriter(req.url);
            }
            proxy.ws(req, socket, head);
            logger.info('[HPM] Upgrading to WebSocket');
        }
    }

    function getProxyErrorHandler () {
        if (_.isFunction(proxyOptions.onError)) {
            return proxyOptions.onError;   // custom error listener
        }

        return handlers.proxyError;       // otherwise fall back to default
    }

    function proxyErrorLogger (err, req, res) {
        var hostname = (req.hostname || req.host) || (req.headers && req.headers.host) // (node0.10 || node 4/5) || (websocket)
        var targetUri = proxyOptions.target.host + req.url;

        logger.error('[HPM] Proxy error: %s. %s -> "%s"', err.code, hostname, targetUri);
    }

};

module.exports = httpProxyMiddleware;
