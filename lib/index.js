var _              = require('lodash');
var httpProxy      = require('http-proxy');
var configFactory  = require('./config-factory');
var handlers       = require('./handlers');
var contextMatcher = require('./context-matcher');
var PathRewriter   = require('./path-rewriter');
var Router         = require('./router');
var logger         = require('./logger').getInstance();
var getArrow       = require('./logger').getArrow;

module.exports = HttpProxyMiddleware;

function HttpProxyMiddleware(context, opts) {
    // https://github.com/chimurai/http-proxy-middleware/issues/57
    var wsUpgradeDebounced  = _.debounce(handleUpgrade);
    var config              = configFactory.createConfig(context, opts);
    var proxyOptions        = config.options;

    // create proxy
    var proxy = httpProxy.createProxyServer({});
    logger.info('[HPM] Proxy created:', config.context, ' -> ', proxyOptions.target);

    var pathRewriter = PathRewriter.create(proxyOptions.pathRewrite); // returns undefined when "pathRewrite" is not provided

    // attach handler to http-proxy events
    handlers.init(proxy, proxyOptions);

    // log errors for debug purpose
    proxy.on('error', logError);

    // https://github.com/chimurai/http-proxy-middleware/issues/19
    // expose function to upgrade externally
    middleware.upgrade = wsUpgradeDebounced;

    return middleware;

    function middleware(req, res, next) {
        // https://github.com/chimurai/http-proxy-middleware/issues/17
        req.url = req.originalUrl;

        if (contextMatcher.match(config.context, req.url, req)) {
            var activeProxyOptions = prepareProxyRequest(req);
            proxy.web(req, res, activeProxyOptions);
        } else {
            next();
        }

        if (proxyOptions.ws === true) {
            catchUpgradeRequest(req.connection.server);
        }
    }

    function catchUpgradeRequest(server) {
        server.on('upgrade', wsUpgradeDebounced);
    }

    function handleUpgrade(req, socket, head) {
        if (contextMatcher.match(config.context, req.url, req)) {
            var activeProxyOptions = prepareProxyRequest(req);
            proxy.ws(req, socket, head, activeProxyOptions);
            logger.info('[HPM] Upgrading to WebSocket');
        }
    }

    /**
     * Apply option.router and option.pathRewrite
     * Order matters:
          Router uses original path for routing;
          NOT the modified path, after it has been rewritten by pathRewrite
     */
    function prepareProxyRequest(req) {
        // store uri before it gets rewritten for logging
        var originalPath = req.url;

        // Apply in order:
        // 1. option.router
        // 2. option.pathRewrite
        var alteredProxyOptions = __applyRouterOption(req, proxyOptions);
        __applyPathRewrite(pathRewriter, req);

        // debug logging for both http(s) and websockets
        if (proxyOptions.logLevel === 'debug') {
            var arrow = getArrow(originalPath, req.url, proxyOptions.target, alteredProxyOptions.target);
            logger.debug('[HPM] %s %s %s %s', req.method, originalPath, arrow, alteredProxyOptions.target);
        }

        return alteredProxyOptions;
    }

    // Modify option.target when router present.
    // return altered options
    function __applyRouterOption(req) {
        var result = proxyOptions;

        if (proxyOptions.router) {
            result = Router.createProxyOptions(req, proxyOptions);
        }

        return result;
    }

    // rewrite path
    function __applyPathRewrite(pathRewriter, req) {
        if (pathRewriter) {
            var path = pathRewriter(req.url, req);

            if (path) {
                req.url =  path;
            } else {
                logger.info('[HPM] pathRewrite: No rewritten path found. (%s)', req.url);
            }
        }
    }

    function logError(err, req, res) {
        var hostname = (req.hostname || req.host) || (req.headers && req.headers.host); // (node0.10 || node 4/5) || (websocket)
        var targetUri = (proxyOptions.target.host || proxyOptions.target) + req.url;

        logger.error('[HPM] PROXY ERROR: %s. %s -> %s', err.code, hostname, targetUri);
    }
};
