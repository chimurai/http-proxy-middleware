import type * as https from 'https';
import type { Request, RequestHandler, Options, Filter } from './types';
import * as httpProxy from 'http-proxy';
import { verifyConfig } from './configuration';
import { matchPathFilter } from './path-filter';
import { getArrow, getLogger } from './logger';
import * as PathRewriter from './path-rewriter';
import * as Router from './router';
import {
  debugProxyErrorsPlugin,
  loggerPlugin,
  errorResponsePlugin,
  proxyEventsPlugin,
} from './plugins/default';

export class HttpProxyMiddleware {
  private logger: Partial<Console>;
  private wsInternalSubscribed = false;
  private serverOnCloseSubscribed = false;
  private proxyOptions: Options;
  private proxy: httpProxy;
  private pathRewriter;

  constructor(options: Options) {
    verifyConfig(options);
    this.logger = getLogger(options);
    this.proxyOptions = options;

    // create proxy
    this.proxy = httpProxy.createProxyServer({});
    this.logger.log(`[HPM] Proxy created: ${options.pathFilter ?? '/'}  -> ${options.target}`);

    this.registerPlugins(this.proxy, this.proxyOptions);

    this.pathRewriter = PathRewriter.createPathRewriter(this.proxyOptions.pathRewrite); // returns undefined when "pathRewrite" is not provided

    // https://github.com/chimurai/http-proxy-middleware/issues/19
    // expose function to upgrade externally
    this.middleware.upgrade = (req, socket, head) => {
      if (!this.wsInternalSubscribed) {
        this.handleUpgrade(req, socket, head);
      }
    };
  }

  // https://github.com/Microsoft/TypeScript/wiki/'this'-in-TypeScript#red-flags-for-this
  public middleware: RequestHandler = async (req, res, next?) => {
    if (this.shouldProxy(this.proxyOptions.pathFilter, req)) {
      try {
        const activeProxyOptions = await this.prepareProxyRequest(req);
        this.proxy.web(req, res, activeProxyOptions);
      } catch (err) {
        next && next(err);
      }
    } else {
      next && next();
    }

    /**
     * Get the server object to subscribe to server events;
     * 'upgrade' for websocket and 'close' for graceful shutdown
     *
     * NOTE:
     * req.socket: node >= 13
     * req.connection: node < 13 (Remove this when node 12/13 support is dropped)
     */
    const server: https.Server = ((req.socket ?? req.connection) as any)?.server;

    if (server && !this.serverOnCloseSubscribed) {
      server.on('close', () => {
        this.logger.log('[HPM] server close signal received: closing proxy server');
        this.proxy.close();
      });
      this.serverOnCloseSubscribed = true;
    }

    if (this.proxyOptions.ws === true) {
      // use initial request to access the server object to subscribe to http upgrade event
      this.catchUpgradeRequest(server);
    }
  };

  private registerPlugins(proxy: httpProxy, options: Options) {
    const defaultPlugins = [
      debugProxyErrorsPlugin,
      proxyEventsPlugin,
      loggerPlugin,
      errorResponsePlugin,
    ];
    const plugins = options.plugins ?? [];
    [...defaultPlugins, ...plugins].forEach((plugin) => plugin(proxy, options));
  }

  private catchUpgradeRequest = (server: https.Server) => {
    if (!this.wsInternalSubscribed) {
      server.on('upgrade', this.handleUpgrade);
      // prevent duplicate upgrade handling;
      // in case external upgrade is also configured
      this.wsInternalSubscribed = true;
    }
  };

  private handleUpgrade = async (req: Request, socket, head) => {
    if (this.shouldProxy(this.proxyOptions.pathFilter, req)) {
      const activeProxyOptions = await this.prepareProxyRequest(req);
      this.proxy.ws(req, socket, head, activeProxyOptions);
      this.logger.log('[HPM] Upgrading to WebSocket');
    }
  };

  /**
   * Determine whether request should be proxied.
   */
  private shouldProxy = (pathFilter: Filter, req: Request): boolean => {
    return matchPathFilter(pathFilter, req.url, req);
  };

  /**
   * Apply option.router and option.pathRewrite
   * Order matters:
   *    Router uses original path for routing;
   *    NOT the modified path, after it has been rewritten by pathRewrite
   * @param {Object} req
   * @return {Object} proxy options
   */
  private prepareProxyRequest = async (req: Request) => {
    // store uri before it gets rewritten for logging
    const originalPath = req.url;
    const newProxyOptions = Object.assign({}, this.proxyOptions);

    // Apply in order:
    // 1. option.router
    // 2. option.pathRewrite
    await this.applyRouter(req, newProxyOptions);
    await this.applyPathRewrite(req, this.pathRewriter);

    // debug logging for both http(s) and websockets
    // TODO: refactor to a logger plugin
    if (this.proxyOptions.logLevel === 'debug') {
      const arrow = getArrow(
        originalPath,
        req.url,
        this.proxyOptions.target,
        newProxyOptions.target
      );
      this.logger.log('[HPM] %s %s %s %s', req.method, originalPath, arrow, newProxyOptions.target);
    }

    return newProxyOptions;
  };

  // Modify option.target when router present.
  private applyRouter = async (req: Request, options) => {
    let newTarget;

    if (options.router) {
      newTarget = await Router.getTarget(req, options);

      if (newTarget) {
        this.logger.log('[HPM] Router new target: %s -> "%s"', options.target, newTarget);
        options.target = newTarget;
      }
    }
  };

  // rewrite path
  private applyPathRewrite = async (req: Request, pathRewriter) => {
    if (pathRewriter) {
      const path = await pathRewriter(req.url, req);

      if (typeof path === 'string') {
        req.url = path;
      } else {
        this.logger.log('[HPM] pathRewrite: No rewritten path found. (%s)', req.url);
      }
    }
  };
}
