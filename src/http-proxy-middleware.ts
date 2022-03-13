import type * as https from 'https';

import type { Request, Response, Options, RequestMiddleware } from './types';
import * as httpProxy from 'http-proxy';
import { verifyConfig } from './configuration';
import { matchPathFilter } from './path-filter';
import * as handlers from './_handlers';
import { getArrow, getInstance } from './logger';
import * as PathRewriter from './path-rewriter';
import * as Router from './router';
import { getUrl } from './url';
import { IncomingMessage } from 'http';

export class HttpProxyMiddleware {
  private logger = getInstance();
  private wsInternalSubscribed = false;
  private serverOnCloseSubscribed = false;
  private proxyOptions: Options;
  private proxy: httpProxy;
  private pathRewriter;

  constructor(options: Options) {
    verifyConfig(options);
    this.proxyOptions = options;

    // create proxy
    this.proxy = httpProxy.createProxyServer({});
    this.logger.info(`[HPM] Proxy created: ${options.pathFilter ?? '/'}  -> ${options.target}`);

    this.pathRewriter = PathRewriter.createPathRewriter(this.proxyOptions.pathRewrite); // returns undefined when "pathRewrite" is not provided

    // attach handler to http-proxy events
    handlers.init(this.proxy, this.proxyOptions);

    // log errors for debug purpose
    this.proxy.on('error', this.logError);

    // https://github.com/chimurai/http-proxy-middleware/issues/19
    // expose function to upgrade externally
    this.middleware.upgrade = (req, socket, head) => {
      if (!this.wsInternalSubscribed) {
        this.handleUpgrade(req, socket, head);
      }
    };
  }

  // https://github.com/Microsoft/TypeScript/wiki/'this'-in-TypeScript#red-flags-for-this
  public middleware: RequestMiddleware = async (req, res, next) => {
    if (this.shouldProxy(this.proxyOptions.pathFilter, req)) {
      try {
        const activeProxyOptions = await this.prepareProxyRequest(req);
        this.proxy.web(req, res, activeProxyOptions);
      } catch (err) {
        next(err);
      }
    } else {
      next();
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
        this.logger.info('[HPM] server close signal received: closing proxy server');
        this.proxy.close();
      });
      this.serverOnCloseSubscribed = true;
    }

    if (this.proxyOptions.ws === true) {
      // use initial request to access the server object to subscribe to http upgrade event
      this.catchUpgradeRequest(server);
    }
  };

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
      this.logger.info('[HPM] Upgrading to WebSocket');
    }
  };

  /**
   * Determine whether request should be proxied.
   */
  private shouldProxy = matchPathFilter;

  /**
   * Apply option.router and option.pathRewrite
   * Order matters:
   *    Router uses original path for routing;
   *    NOT the modified path, after it has been rewritten by pathRewrite
   * @param {Object} req
   * @return {Object} proxy options
   */
  private prepareProxyRequest = async (req: Request) => {
    // Store pathname before it gets rewritten for logging
    const originalPath = getUrl(req);
    /**
     * @warn May be hazardous to express users. HPM, Express, &
     * http.IncomingMessage all write to this field.
     * {@link https://github.com/chimurai/http-proxy-middleware/issues/17}
     * {@link https://github.com/chimurai/http-proxy-middleware/issues/94}
     */
    (req as IncomingMessage).url = originalPath;

    const newProxyOptions = Object.assign({}, this.proxyOptions);

    // Apply in order:
    // 1. option.router
    // 2. option.pathRewrite
    await this.applyRouter(req, newProxyOptions);
    await this.applyPathRewrite(req, this.pathRewriter);

    // debug logging for both http(s) and websockets
    if (this.proxyOptions.logLevel === 'debug') {
      const arrow = getArrow(
        originalPath,
        getUrl(req),
        this.proxyOptions.target,
        newProxyOptions.target
      );
      this.logger.debug(
        '[HPM] %s %s %s %s',
        req.method,
        originalPath,
        arrow,
        newProxyOptions.target
      );
    }

    return newProxyOptions;
  };

  // Modify option.target when router present.
  private applyRouter = async (req: Request, options) => {
    let newTarget;

    if (options.router) {
      newTarget = await Router.getTarget(req, options);

      if (newTarget) {
        this.logger.debug('[HPM] Router new target: %s -> "%s"', options.target, newTarget);
        options.target = newTarget;
      }
    }
  };

  // rewrite path
  private applyPathRewrite = async (req: Request, pathRewriter) => {
    const url = getUrl(req);
    if (pathRewriter) {
      const path = await pathRewriter(url, req);

      if (typeof path === 'string') {
        /**
         * @warn May be hazardous to express users. HPM, Express, &
         * http.IncomingMessage all write to this field.
         */
        (req as IncomingMessage).url = path;
      } else {
        this.logger.info('[HPM] pathRewrite: No rewritten path found. (%s)', url);
      }
    }
  };

  private logError = (err, req: Request, res: Response, target?) => {
    const hostname = req.headers?.host;
    const requestHref = `${hostname || ''}${getUrl(req)}`;
    const targetHref = `${target?.href}`; // target is undefined when websocket errors

    const errorMessage = '[HPM] Error occurred while proxying request %s to %s [%s] (%s)';
    const errReference = 'https://nodejs.org/api/errors.html#errors_common_system_errors'; // link to Node Common Systems Errors page

    this.logger.error(errorMessage, requestHref, targetHref, err.code || err, errReference);
  };
}
