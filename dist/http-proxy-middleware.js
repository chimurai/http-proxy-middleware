"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const httpProxy = require("http-proxy");
const _ = require("lodash");
const config_factory_1 = require("./config-factory");
const contextMatcher = require("./context-matcher");
const handlers = require("./handlers");
const logger_1 = require("./logger");
const PathRewriter = require("./path-rewriter");
const Router = require("./router");
class HttpProxyMiddleware {
    constructor(context, opts) {
        this.logger = logger_1.getInstance();
        this.wsInitialized = false;
        // https://github.com/Microsoft/TypeScript/wiki/'this'-in-TypeScript#red-flags-for-this
        this.middleware = (req, res, next) => __awaiter(this, void 0, void 0, function* () {
            if (this.shouldProxy(this.config.context, req)) {
                const activeProxyOptions = this.prepareProxyRequest(req);
                this.proxy.web(req, res, activeProxyOptions);
            }
            else {
                next();
            }
            if (this.proxyOptions.ws === true) {
                // use initial request to access the server object to subscribe to http upgrade event
                this.catchUpgradeRequest(req.connection.server);
            }
        });
        this.catchUpgradeRequest = server => {
            // subscribe once; don't subscribe on every request...
            // https://github.com/chimurai/http-proxy-middleware/issues/113
            if (!this.wsInitialized) {
                server.on('upgrade', this.wsUpgradeDebounced);
                this.wsInitialized = true;
            }
        };
        this.handleUpgrade = (req, socket, head) => {
            // set to initialized when used externally
            this.wsInitialized = true;
            if (this.shouldProxy(this.config.context, req)) {
                const activeProxyOptions = this.prepareProxyRequest(req);
                this.proxy.ws(req, socket, head, activeProxyOptions);
                this.logger.info('[HPM] Upgrading to WebSocket');
            }
        };
        /**
         * Determine whether request should be proxied.
         *
         * @private
         * @param  {String} context [description]
         * @param  {Object} req     [description]
         * @return {Boolean}
         */
        this.shouldProxy = (context, req) => {
            const path = req.originalUrl || req.url;
            return contextMatcher.match(context, path, req);
        };
        /**
         * Apply option.router and option.pathRewrite
         * Order matters:
         *    Router uses original path for routing;
         *    NOT the modified path, after it has been rewritten by pathRewrite
         * @param {Object} req
         * @return {Object} proxy options
         */
        this.prepareProxyRequest = req => {
            // https://github.com/chimurai/http-proxy-middleware/issues/17
            // https://github.com/chimurai/http-proxy-middleware/issues/94
            req.url = req.originalUrl || req.url;
            // store uri before it gets rewritten for logging
            const originalPath = req.url;
            const newProxyOptions = _.assign({}, this.proxyOptions);
            // Apply in order:
            // 1. option.router
            // 2. option.pathRewrite
            this.applyRouter(req, newProxyOptions);
            this.applyPathRewrite(req, this.pathRewriter);
            // debug logging for both http(s) and websockets
            if (this.proxyOptions.logLevel === 'debug') {
                const arrow = logger_1.getArrow(originalPath, req.url, this.proxyOptions.target, newProxyOptions.target);
                this.logger.debug('[HPM] %s %s %s %s', req.method, originalPath, arrow, newProxyOptions.target);
            }
            return newProxyOptions;
        };
        // Modify option.target when router present.
        this.applyRouter = (req, options) => {
            let newTarget;
            if (options.router) {
                newTarget = Router.getTarget(req, options);
                if (newTarget) {
                    this.logger.debug('[HPM] Router new target: %s -> "%s"', options.target, newTarget);
                    options.target = newTarget;
                }
            }
        };
        // rewrite path
        this.applyPathRewrite = (req, pathRewriter) => {
            if (pathRewriter) {
                const path = pathRewriter(req.url, req);
                if (typeof path === 'string') {
                    req.url = path;
                }
                else {
                    this.logger.info('[HPM] pathRewrite: No rewritten path found. (%s)', req.url);
                }
            }
        };
        this.logError = (err, req, res) => {
            const hostname = (req.headers && req.headers.host) || (req.hostname || req.host); // (websocket) || (node0.10 || node 4/5)
            const target = this.proxyOptions.target.host || this.proxyOptions.target;
            const errorMessage = '[HPM] Error occurred while trying to proxy request %s from %s to %s (%s) (%s)';
            const errReference = 'https://nodejs.org/api/errors.html#errors_common_system_errors'; // link to Node Common Systems Errors page
            this.logger.error(errorMessage, req.url, hostname, target, err.code || err, errReference);
        };
        // https://github.com/chimurai/http-proxy-middleware/issues/57
        this.wsUpgradeDebounced = _.debounce(this.handleUpgrade);
        this.config = config_factory_1.createConfig(context, opts);
        this.proxyOptions = this.config.options;
        // create proxy
        this.proxy = httpProxy.createProxyServer({});
        this.logger.info(`[HPM] Proxy created: ${this.config.context}  -> ${this.proxyOptions.target}`);
        this.pathRewriter = PathRewriter.createPathRewriter(this.proxyOptions.pathRewrite); // returns undefined when "pathRewrite" is not provided
        // attach handler to http-proxy events
        handlers.init(this.proxy, this.proxyOptions);
        // log errors for debug purpose
        this.proxy.on('error', this.logError);
        // https://github.com/chimurai/http-proxy-middleware/issues/19
        // expose function to upgrade externally
        // middleware.upgrade = wsUpgradeDebounced
        this.middleware.upgrade = this.wsUpgradeDebounced;
    }
}
exports.HttpProxyMiddleware = HttpProxyMiddleware;
