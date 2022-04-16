import type * as https from 'https';
import type { Request, RequestHandler, Options, Filter } from './types';
import * as httpProxy from 'http-proxy';
import { verifyConfig } from './configuration';
import { getPlugins } from './get-plugins';
import { matchPathFilter } from './path-filter';
import * as PathRewriter from './path-rewriter';
import * as Router from './router';
import { Debug as debug } from './debug';
import { getFunctionName } from './utils/function';

export class HttpProxyMiddleware {
  private wsInternalSubscribed = false;
  private serverOnCloseSubscribed = false;
  private proxyOptions: Options;
  private proxy: httpProxy;
  private pathRewriter;

  constructor(options: Options) {
    verifyConfig(options);
    this.proxyOptions = options;

    debug(`create proxy server`);
    this.proxy = httpProxy.createProxyServer({});

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
        debug(`proxy request to target: %O`, activeProxyOptions.target);
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
        debug('server close signal received: closing proxy server');
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
    const plugins = getPlugins(options);
    plugins.forEach((plugin) => {
      debug(`register plugin: "${getFunctionName(plugin)}"`);
      plugin(proxy, options);
    });
  }

  private catchUpgradeRequest = (server: https.Server) => {
    if (!this.wsInternalSubscribed) {
      debug('subscribing to server upgrade event');
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
      debug('server upgrade event received. Proxying WebSocket');
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
    const newProxyOptions = Object.assign({}, this.proxyOptions);

    // Apply in order:
    // 1. option.router
    // 2. option.pathRewrite
    await this.applyRouter(req, newProxyOptions);
    await this.applyPathRewrite(req, this.pathRewriter);

    return newProxyOptions;
  };

  // Modify option.target when router present.
  private applyRouter = async (req: Request, options) => {
    let newTarget;

    if (options.router) {
      newTarget = await Router.getTarget(req, options);

      if (newTarget) {
        debug('router new target: "%s"', newTarget);
        options.target = newTarget;
      }
    }
  };

  // rewrite path
  private applyPathRewrite = async (req: Request, pathRewriter) => {
    if (pathRewriter) {
      const path = await pathRewriter(req.url, req);

      if (typeof path === 'string') {
        debug('pathRewrite new path: %s', req.url);
        req.url = path;
      } else {
        debug('pathRewrite: no rewritten path found: %s', req.url);
      }
    }
  };
}
