import type * as http from 'node:http';
import type * as https from 'node:https';
import type * as net from 'node:net';

import { type ProxyServer, createProxyServer } from 'httpxy';

import { verifyConfig } from './configuration';
import { Debug as debug } from './debug';
import { getPlugins } from './get-plugins';
import { getLogger } from './logger';
import { matchPathFilter } from './path-filter';
import * as PathRewriter from './path-rewriter';
import * as Router from './router';
import type { Filter, Logger, Options, RequestHandler } from './types';
import { getFunctionName } from './utils/function';

export class HttpProxyMiddleware<TReq, TRes> {
  private wsInternalSubscribed = false;
  private serverOnCloseSubscribed = false;
  private proxyOptions: Options<TReq, TRes>;
  private proxy: ProxyServer;
  private pathRewriter;
  private logger: Logger;

  constructor(options: Options<TReq, TRes>) {
    verifyConfig<TReq, TRes>(options);
    this.proxyOptions = options;
    this.logger = getLogger(options as unknown as Options);

    debug(`create proxy server`);
    this.proxy = createProxyServer({});

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
  public middleware: RequestHandler = (async (req, res, next?) => {
    if (this.shouldProxy(this.proxyOptions.pathFilter, req)) {
      try {
        const activeProxyOptions = await this.prepareProxyRequest(req);
        debug(`proxy request to target: %O`, activeProxyOptions.target);
        this.proxy.web(req, res, activeProxyOptions);
      } catch (err) {
        next?.(err);
      }
    } else {
      next?.();
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
        this.proxy.close(() => {
          debug('proxy server closed');
        });
      });
      this.serverOnCloseSubscribed = true;
    }

    if (this.proxyOptions.ws === true) {
      // use initial request to access the server object to subscribe to http upgrade event
      this.catchUpgradeRequest(server);
    }
  }) as RequestHandler;

  private registerPlugins(proxy: ProxyServer, options: Options<TReq, TRes>) {
    const plugins = getPlugins<TReq, TRes>(options);
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

  private handleUpgrade = async (req: http.IncomingMessage, socket: net.Socket, head: Buffer) => {
    try {
      if (this.shouldProxy(this.proxyOptions.pathFilter, req)) {
        const activeProxyOptions = await this.prepareProxyRequest(req);
        this.proxy.ws(req, socket, activeProxyOptions, head);
        debug('server upgrade event received. Proxying WebSocket');
      }
    } catch (err) {
      // This error does not include the URL as the fourth argument as we won't
      // have the URL if `this.prepareProxyRequest` throws an error.
      this.proxy.emit('error', err, req, socket);
    }
  };

  /**
   * Determine whether request should be proxied.
   */
  private shouldProxy = (
    pathFilter: Filter<TReq> | undefined,
    req: http.IncomingMessage,
  ): boolean => {
    try {
      return matchPathFilter(pathFilter, req.url, req);
    } catch (err) {
      debug('Error: matchPathFilter() called with request url: ', `"${req.url}"`);
      this.logger.error(err);
      return false;
    }
  };

  /**
   * Apply option.router and option.pathRewrite
   * Order matters:
   *    Router uses original path for routing;
   *    NOT the modified path, after it has been rewritten by pathRewrite
   * @param {Object} req
   * @return {Object} proxy options
   */
  private prepareProxyRequest = async (req: http.IncomingMessage) => {
    /**
     * Incorrect usage confirmed: https://github.com/expressjs/express/issues/4854#issuecomment-1066171160
     * Temporary restore req.url patch for {@link src/legacy/create-proxy-middleware.ts legacyCreateProxyMiddleware()}
     * FIXME: remove this patch in future release
     */
    if ((this.middleware as unknown as any).__LEGACY_HTTP_PROXY_MIDDLEWARE__) {
      req.url = (req as unknown as any).originalUrl || req.url;
    }

    const newProxyOptions = Object.assign({}, this.proxyOptions);

    // Apply in order:
    // 1. option.router
    // 2. option.pathRewrite
    await this.applyRouter(req, newProxyOptions);
    await this.applyPathRewrite(req, this.pathRewriter);

    return newProxyOptions;
  };

  // Modify option.target when router present.
  private applyRouter = async (req: http.IncomingMessage, options: Options<TReq, TRes>) => {
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
  private applyPathRewrite = async (req: http.IncomingMessage, pathRewriter) => {
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
